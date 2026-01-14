"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, Package, Loader2, Search, Trash2, Edit3, 
  Clock, Camera, Image as ImageIcon, Sparkles,
  Coins, Database, Layers, X
} from 'lucide-react'
import ProductModal from '@/components/ProductModal'
import { getMarketRates } from '@/utils/blockchain'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'

export default function FarmerProductsPage() {
  const { user, supabase } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [uploadingId, setUploadingId] = useState(null)
  const [rates, setRates] = useState(null)

  const categories = ['All', 'Rice', 'Vegetables', 'Fruits', 'Spices', 'Others']

  const fetchInitialData = async () => {
    if (!user) return
    try {
      const [prodRes, rateRes] = await Promise.all([
        supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        getMarketRates()
      ])
      setProducts(prodRes.data || [])
      setRates(rateRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInitialData() }, [user])

  const handleUploadImage = async (e, productId) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingId(productId)
    const toastId = toast.loading("Syncing asset visualization...")

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${productId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
      const { error: updateError } = await supabase.from('products').update({ image_url: publicUrl }).eq('id', productId)
      if (updateError) throw updateError
      
      toast.success("Identity updated", { id: toastId })
      fetchInitialData()
    } catch (err) {
      toast.error(err.message, { id: toastId })
    } finally {
      setUploadingId(null)
    }
  }

  const handleDelete = async (id) => {
    toast("Remove asset from protocol?", {
      description: "This action will permanently delete the SKU from the node network.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', id)
            if (error) throw error
            toast.success("Asset purged from node")
            fetchInitialData()
          } catch (err) {
            toast.error(err.message)
          }
        },
      },
    })
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse italic">Synchronizing Asset Catalog...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 font-raleway pb-32 min-h-screen text-left transition-colors duration-500 bg-background">
      <header className="mb-12 space-y-10">
        <div className="flex justify-between items-end px-1">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter italic leading-none">Harvest Catalog<span className="text-harvest">.</span></h1>
            <p className="text-stone/40 text-xs font-bold tracking-widest uppercase italic">Node Asset Management Console</p>
          </div>
          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="w-14 h-14 md:w-16 md:h-16 bg-forest dark:bg-harvest text-white rounded-2xl md:rounded-3xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/20 group-focus-within:text-harvest transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search assets or protocol IDs..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-16 pl-14 pr-4 rounded-[2rem] bg-card border-2 border-border focus:border-harvest outline-none text-sm font-semibold italic transition-all shadow-sm" 
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3.5 rounded-2xl text-[10px] font-bold whitespace-nowrap transition-all border-2 tracking-widest uppercase ${
                  selectedCategory === cat 
                  ? 'bg-forest dark:bg-harvest text-white border-transparent shadow-xl' 
                  : 'bg-card text-stone/40 border-border hover:border-harvest/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {filteredProducts.length === 0 ? (
        <div className="py-32 text-center bg-card rounded-[3rem] border-2 border-dashed border-border">
          <Package size={64} strokeWidth={1} className="mx-auto text-stone/10 mb-6" />
          <p className="text-stone/40 font-bold tracking-widest text-xs italic">No active assets found in this node protocol.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="group border-2 border-border shadow-sm hover:shadow-2xl transition-all duration-500 bg-card rounded-[3rem] overflow-hidden relative">
              <div className="relative h-64 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                    <ImageIcon size={48} strokeWidth={0.5} className="text-stone/20" />
                    <p className="text-[9px] font-bold tracking-[0.3em] uppercase mt-3 opacity-30 italic">Awaiting Visual Node</p>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                   <label className="cursor-pointer bg-white text-forest p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-90 transition-all">
                      {uploadingId === p.id ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                      <input 
                        type="file" className="hidden" accept="image/*" 
                        onChange={(e) => handleUploadImage(e, p.id)} 
                        disabled={uploadingId !== null}
                      />
                   </label>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="border-harvest/30 text-harvest font-black px-4 py-1.5 rounded-xl text-[10px] tracking-widest uppercase italic">
                    {p.category}
                  </Badge>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }} className="p-3 bg-muted text-stone/40 hover:text-harvest hover:bg-harvest/5 rounded-2xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-3 bg-muted text-stone/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground tracking-tight italic truncate leading-none">
                  {p.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-3xl border-2 transition-all ${p.stock_kg < 10 ? 'bg-red-500/5 border-red-500/20' : 'bg-muted border-border'}`}>
                    <div className="flex items-center gap-2 mb-2">
                       <Database size={12} className="text-stone/30" />
                       <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest">Inventory</p>
                    </div>
                    <p className={`text-xl font-bold tabular-nums italic ${p.stock_kg < 10 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                      {p.stock_kg} <span className="text-xs opacity-30 font-semibold">kg</span>
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl border-2 bg-muted border-border">
                    <div className="flex items-center gap-2 mb-2">
                       <Coins size={12} className="text-harvest" />
                       <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest">Price / kg</p>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums italic">
                      Ξ {p.price_per_kg}
                    </p>
                    <p className="text-[9px] font-bold text-stone/30 italic">≈ ${ (p.price_per_kg * (rates?.ethToUsd || 0)).toFixed(2) }</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                   <div className="flex items-center gap-2 text-[10px] text-stone/30 font-bold uppercase tracking-widest">
                      <Layers size={14} /> Node Sync
                   </div>
                   <span className="text-[10px] font-bold text-stone/40 italic">
                      {new Date(p.created_at).toLocaleDateString()}
                   </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )} 

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        supabase={supabase} 
        onSuccess={fetchInitialData} 
        initialData={selectedProduct}  
      />
    </div>
  )
}
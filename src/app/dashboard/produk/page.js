"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, Package, Loader2, Search, Trash2, Edit3, Clock, Camera, Image as ImageIcon, Sparkles } from 'lucide-react'
import ProductModal from '@/components/ProductModal'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function FarmerProductsPage() {
  const { user, supabase } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [uploadingId, setUploadingId] = useState(null)

  const categories = ['All', 'Rice', 'Vegetables', 'Fruits', 'Spices', 'Others']

  const toUSD = (price) => (price / 15600).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const fetchProducts = async () => {
    if (!user) return
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [user])

  const handleUploadImage = async (e, productId) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingId(productId)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${productId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) throw updateError
      
      fetchProducts()
    } catch (err) {
      alert("Image upload failed: " + err.message)
    } finally {
      setUploadingId(null)
    }
  }

  const openAddModal = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Permanently remove this asset from the protocol?")) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error
        fetchProducts()
      } catch (err) {
        alert("Operation failed: " + err.message)
      }
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="mt-4 text-stone/40 text-[10px] font-bold tracking-[0.2em]">Syncing Catalog...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 font-raleway pb-32 min-h-screen text-left">
      <header className="mb-10 space-y-8">
        <div className="flex justify-between items-center px-1">
          <div>
            {/* <div className="flex items-center gap-2 mb-1">
               <Sparkles size={14} className="text-harvest" />
               <p className="text-[10px] font-bold text-stone/40 tracking-widest leading-none">Node Asset Management</p>
            </div> */}
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">Harvest Catalog</h1>
          </div>
          <Button 
            onClick={openAddModal} 
            className="bg-forest hover:bg-forest/95 text-white rounded-2xl h-11 px-5 shadow-xl shadow-forest/10 active:scale-95 transition-all"
          >
            <Plus size={18} className="mr-2" />
            <span className="font-bold text-xs tracking-wider">Add</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/30 group-focus-within:text-forest transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter by asset name or SKU..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-clay/50 outline-none text-sm font-medium transition-all focus:ring-4 focus:ring-forest/5 shadow-sm" 
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border tracking-widest ${
                  selectedCategory === cat 
                  ? 'bg-forest text-white border-forest shadow-md' 
                  : 'bg-white text-stone/50 border-clay/50 hover:bg-chalk'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-clay/30 shadow-sm">
          <Package size={48} strokeWidth={1} className="mx-auto text-clay/60 mb-4" />
          <p className="text-stone/40 font-bold tracking-widest text-[10px]">No active assets found in this node.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="group border-none shadow-sm hover:shadow-2xl hover:shadow-forest/5 transition-all duration-500 bg-white rounded-[2.5rem] overflow-hidden">
              <div className="relative h-48 bg-slate-50 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-clay/30 bg-chalk/20">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <p className="text-[8px] font-bold tracking-widest mt-2">Awaiting Visual</p>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <label className="cursor-pointer bg-white text-forest p-3 rounded-2xl shadow-2xl hover:scale-110 active:scale-90 transition-all">
                      {uploadingId === p.id ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleUploadImage(e, p.id)}
                        disabled={uploadingId !== null}
                      />
                   </label>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-chalk text-forest font-bold px-3 py-1 rounded-lg border border-clay/30 text-[9px] tracking-wider">
                    {p.category}
                  </Badge>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(p)} className="p-2 text-stone/30 hover:text-forest hover:bg-forest/5 rounded-xl transition-all"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-stone/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate">
                  {p.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className={`p-4 rounded-2xl border transition-colors ${p.stock_kg < 10 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[8px] font-bold text-stone/40 tracking-widest mb-1">Available Stock</p>
                    <p className={`text-base font-bold tabular-nums ${p.stock_kg < 10 ? 'text-red-600' : 'text-forest'}`}>
                      {p.stock_kg} <span className="text-[10px] opacity-60">kg</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-bold text-stone/40 tracking-widest mb-1">Price per KG</p>
                    <p className="text-base font-bold text-forest tabular-nums">
                      {toUSD(p.price_per_kg)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[9px] text-stone/30 font-bold pt-3 border-t border-slate-50 tracking-wider">
                  <Clock size={12} />
                  Synchronized: {new Date(p.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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
        onSuccess={fetchProducts} 
        initialData={selectedProduct}  
      />
    </div>
  )
}
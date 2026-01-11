"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, Package, Loader2, Search, Trash2, Edit3, Clock, Camera, Image as ImageIcon } from 'lucide-react'
import ProductModal from '@/components/ProductModal'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    if (confirm("Are you sure you want to remove this product from the market?")) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error
        fetchProducts()
      } catch (err) {
        alert("Delete failed: " + err.message)
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
      <p className="mt-4 text-stone/60 text-xs font-bold uppercase tracking-widest">Loading Catalog...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 font-raleway pb-32 min-h-screen">
      <header className="mb-10 space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-forest leading-tight italic uppercase tracking-tighter">Harvest Catalog</h1>
            <p className="text-stone text-sm mt-1 font-medium italic lowercase">Manage your crops and product documentation.</p>
          </div>
          <Button 
            onClick={openAddModal} 
            className="bg-forest hover:bg-forest/90 text-white rounded-2xl h-12 w-12 md:w-auto md:px-6 shadow-xl shadow-forest/20 transition-all active:scale-95"
          >
            <Plus size={20} className="md:mr-2" />
            <span className="hidden md:inline font-bold">Add Product</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/40" size={18} />
            <input 
              type="text" 
              placeholder="Search product name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 h-12 rounded-2xl bg-white border border-clay outline-none text-sm transition-all focus:ring-4 focus:ring-forest/5" 
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                  ? 'bg-forest text-white border-forest shadow-md' 
                  : 'bg-white text-stone/60 border-clay hover:border-forest/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-chalk/50 rounded-[3rem] border-2 border-dashed border-clay">
          <Package size={48} className="mx-auto text-clay mb-4" />
          <p className="text-stone font-medium italic uppercase tracking-widest text-xs">Catalog is empty or no products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white rounded-[2.5rem] overflow-hidden">
              <div className="relative h-56 bg-chalk overflow-hidden group-hover:scale-105 transition-transform duration-700">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-clay/40">
                    <ImageIcon size={40} strokeWidth={1} />
                    <p className="text-[10px] font-bold uppercase mt-2">No Photo Yet</p>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <label className="cursor-pointer bg-white text-forest p-3 rounded-full shadow-xl hover:scale-110 transition-transform">
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

              <CardHeader className="pb-2 space-y-4 text-left">
                <div className="flex justify-between items-start">
                  <Badge className="bg-clay text-forest font-bold px-4 py-1.5 rounded-full border-none text-[10px] uppercase tracking-wider">
                    {p.category}
                  </Badge>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(p)} className="p-2.5 text-stone/40 hover:text-forest hover:bg-forest/5 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2.5 text-stone/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-forest tracking-tight italic uppercase">
                  {p.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-2 space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-3xl border shadow-inner transition-colors ${p.stock_kg < 10 ? 'bg-red-50 border-red-100' : 'bg-chalk border-clay'}`}>
                    <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">Stock</p>
                    <p className={`text-lg font-bold tracking-tight ${p.stock_kg < 10 ? 'text-red-600' : 'text-forest'}`}>
                      {p.stock_kg} <span className="text-xs font-medium lowercase">kg</span>
                    </p>
                  </div>
                  <div className="bg-chalk p-5 rounded-3xl border border-clay shadow-inner">
                    <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">Price /kg</p>
                    <p className="text-lg font-bold text-forest tracking-tight italic">
                      {toUSD(p.price_per_kg)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-stone font-bold pt-2 uppercase tracking-tighter border-t border-chalk">
                  <Clock size={12} className="text-stone/40" />
                  Last update: {new Date(p.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </CardContent>
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
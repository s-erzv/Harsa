"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, Package, Loader2, Search, Trash2, Edit3 } from 'lucide-react'
import AddProductModal from '@/components/AddProductModal'
import EditProductModal from '@/components/EditProductModal'

export default function FarmerProductsPage() {
  const { user, supabase } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchProducts = async () => {
    if (!user) return
    const { data } = await supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [user])

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus produk ini dari pasar?")) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error
        fetchProducts()
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-emerald-800" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 font-raleway pb-32">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">katalog panen</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">manajemen inventaris anda</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-300" size={18} />
            <input type="text" placeholder="cari produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3.5 rounded-2xl bg-slate-50 border-none outline-none text-sm font-bold w-full md:w-64" />
          </div>
          <button onClick={() => setIsAddOpen(true)} className="bg-emerald-800 text-white p-4 rounded-2xl shadow-xl hover:bg-emerald-900 transition"><Plus size={20} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-emerald-50 rounded-[1.5rem] text-emerald-800"><Package size={24} /></div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedProduct(p); setIsEditOpen(true); }}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mb-8">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{p.category}</span>
              <h3 className="text-xl font-black text-slate-800 mt-3 tracking-tighter italic">{p.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">stok</p>
                <p className="font-black text-slate-700 tracking-tighter">{p.stock_kg} kg</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">harga</p>
                <p className="font-black text-emerald-800 tracking-tighter italic">Rp {p.price_per_kg?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddProductModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} user={user} supabase={supabase} onSuccess={fetchProducts} />
      <EditProductModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} product={selectedProduct} supabase={supabase} onSuccess={fetchProducts} />
    </div>
  )
}
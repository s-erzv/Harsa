"use client"
import React, { useState } from 'react'
import { X, ChevronDown, Loader2 } from 'lucide-react'

export default function AddProductModal({ isOpen, onClose, user, supabase, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Beras',
    price_per_kg: '',
    stock_kg: '',
    description: ''
  })

  if (!isOpen) return null

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('products').insert([{
        ...newProduct,
        seller_id: user.id,
        price_per_kg: parseFloat(newProduct.price_per_kg),
        stock_kg: parseFloat(newProduct.stock_kg)
      }])

      if (error) throw error
      
      setNewProduct({ name: '', category: 'Beras', price_per_kg: '', stock_kg: '', description: '' })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 font-raleway">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">daftarkan hasil panen</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleAddProduct} className="space-y-6">
          <div className="grid grid-cols-2 gap-6 text-slate-900">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">nama produk</label>
              <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-800/20 outline-none transition text-sm font-bold" placeholder="Contoh: Beras Mentik Susu" />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">kategori</label>
              <div className="relative">
                <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none appearance-none focus:ring-2 focus:ring-emerald-800/20 outline-none transition text-sm font-bold cursor-pointer">
                  <option>Beras</option><option>Jagung</option><option>Kedelai</option><option>Kopi</option>
                </select>
                <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">stok (kg)</label>
              <input required type="number" value={newProduct.stock_kg} onChange={e => setNewProduct({...newProduct, stock_kg: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-800/20 outline-none transition text-sm font-bold" placeholder="0" />
            </div>

            <div className="col-span-2 text-slate-900">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">harga per kg (Rp)</label>
              <input required type="number" value={newProduct.price_per_kg} onChange={e => setNewProduct({...newProduct, price_per_kg: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-800/20 outline-none transition text-sm font-bold" placeholder="0" />
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-900/20 hover:bg-emerald-900 transition active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'daftarkan hasil tani'}
          </button>
        </form>
      </div>
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { X, ChevronDown, Loader2 } from 'lucide-react'

export default function EditProductModal({ isOpen, onClose, product, supabase, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price_per_kg: '',
    stock_kg: ''
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price_per_kg: product.price_per_kg,
        stock_kg: product.stock_kg
      })
    }
  }, [product])

  if (!isOpen) return null

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...formData,
          price_per_kg: parseFloat(formData.price_per_kg),
          stock_kg: parseFloat(formData.stock_kg)
        })
        .eq('id', product.id)

      if (error) throw error
      onSuccess()
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
          <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">update hasil panen</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-6 text-slate-900">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">nama produk</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">kategori</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm appearance-none cursor-pointer">
                <option>Beras</option><option>Jagung</option><option>Kedelai</option><option>Kopi</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">stok (kg)</label>
              <input required type="number" value={formData.stock_kg} onChange={e => setFormData({...formData, stock_kg: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2">harga per kg (rp)</label>
              <input required type="number" value={formData.price_per_kg} onChange={e => setFormData({...formData, price_per_kg: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm" />
            </div>
          </div>
          <button disabled={isSubmitting} className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-900 transition flex items-center justify-center gap-3">
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'simpan perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}
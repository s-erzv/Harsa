"use client"
import React, { useState } from 'react'
import { X, Loader2, Save, Calendar, Tag, MessageSquare, Plus } from 'lucide-react'

export default function FarmLogModal({ isOpen, onClose, user, products, supabase, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    activity_name: '',
    description: '',
    logged_at: new Date().toISOString().split('T')[0]
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.product_id) return alert("Pilih produk terlebih dahulu!")
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('farm_logs')
        .insert([{
          product_id: formData.product_id,
          activity_name: formData.activity_name,
          description: formData.description,
          logged_at: formData.logged_at
        }])

      if (error) throw error
      
      onSuccess()
      onClose()
      setFormData({ product_id: '', activity_name: '', description: '', logged_at: new Date().toISOString().split('T')[0] })
    } catch (err) {
      alert("Gagal mencatat aktivitas: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 font-raleway">
        <div className="bg-forest p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold italic tracking-tight">Catat Aktivitas Tani</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest flex items-center gap-2 ml-1">
              <Tag size={12} className="text-harvest"/> Pilih Produk
            </label>
            <select 
              required
              className="w-full p-4 rounded-2xl bg-chalk border border-clay outline-none font-bold text-sm text-forest"
              value={formData.product_id}
              onChange={e => setFormData({...formData, product_id: e.target.value})}
            >
              <option value="">-- Pilih Hasil Panen --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest flex items-center gap-2 ml-1">
              <Calendar size={12} className="text-harvest"/> Tanggal Aktivitas
            </label>
            <input 
              type="date"
              className="w-full p-4 rounded-2xl bg-chalk border border-clay outline-none font-bold text-sm"
              value={formData.logged_at}
              onChange={e => setFormData({...formData, logged_at: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest flex items-center gap-2 ml-1">
              <Plus size={12} className="text-harvest"/> Nama Aktivitas
            </label>
            <input 
              required
              placeholder="Misal: Pemupukan Organik"
              className="w-full p-4 rounded-2xl bg-chalk border border-clay outline-none text-sm font-medium"
              value={formData.activity_name}
              onChange={e => setFormData({...formData, activity_name: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest flex items-center gap-2 ml-1">
              <MessageSquare size={12} className="text-harvest"/> Deskripsi Singkat
            </label>
            <textarea 
              placeholder="Ceritakan detail aktivitasnya..."
              className="w-full p-4 rounded-2xl bg-chalk border border-clay outline-none text-sm font-medium h-24"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-4 bg-forest text-white rounded-2xl font-bold shadow-xl shadow-forest/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
            Simpan ke Blockchain
          </button>
        </form>
      </div>
    </div>
  )
}
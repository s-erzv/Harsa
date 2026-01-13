"use client"
import React, { useState } from 'react'
import { X, Loader2, Save, Calendar, Tag, MessageSquare, Plus, Database } from 'lucide-react'

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
    if (!formData.product_id) return alert("Please select a target product node!")
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('farm_logs')
        .insert([{
          product_id: formData.product_id,
          activity_name: formData.activity_name,
          description: formData.description,
          logged_at: formData.logged_at,
          seller_id: user.id 
        }])

      if (error) throw error
      
      onSuccess()
      onClose()
      setFormData({ product_id: '', activity_name: '', description: '', logged_at: new Date().toISOString().split('T')[0] })
    } catch (err) {
      alert("Protocol synchronization failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest/20 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 font-raleway border border-clay/20">
        
        <div className="bg-forest p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight leading-none mb-1">Synchronize Log</h2>
            <p className="text-[10px] font-bold text-emerald-300 tracking-widest opacity-80">Traceability Protocol Layer</p>
          </div>
          <button 
            onClick={onClose} 
            className="relative z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
          >
            <X size={20}/>
          </button>
          <Database className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 rotate-12 pointer-events-none" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone/50 tracking-[0.2em] flex items-center gap-2 ml-1">
              <Tag size={12} className="text-harvest"/> Target Asset Node
            </label>
            <select 
              required
              className="w-full p-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none font-bold text-sm text-forest focus:ring-4 focus:ring-forest/5 transition-all appearance-none"
              value={formData.product_id}
              onChange={e => setFormData({...formData, product_id: e.target.value})}
            >
              <option value="">Select Inventory</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name.t()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone/50 tracking-[0.2em] flex items-center gap-2 ml-1">
              <Calendar size={12} className="text-harvest"/> Log Timestamp
            </label>
            <input 
              type="date"
              required
              className="w-full p-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none font-bold text-sm focus:ring-4 focus:ring-forest/5 transition-all"
              value={formData.logged_at}
              onChange={e => setFormData({...formData, logged_at: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone/50 tracking-[0.2em] flex items-center gap-2 ml-1">
              <Plus size={12} className="text-harvest"/> Operation Name
            </label>
            <input 
              required
              placeholder="e.g. Organic Fertilization"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none text-sm font-semibold focus:ring-4 focus:ring-forest/5 transition-all"
              value={formData.activity_name}
              onChange={e => setFormData({...formData, activity_name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone/50 tracking-[0.2em] flex items-center gap-2 ml-1">
              <MessageSquare size={12} className="text-harvest"/> Protocol Notes
            </label>
            <textarea 
              placeholder="Enter detailed operation logs for buyer verification..."
              className="w-full p-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none text-sm font-medium h-28 focus:ring-4 focus:ring-forest/5 transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-5 bg-forest text-white rounded-[1.5rem] font-bold text-[11px] tracking-[0.2em] shadow-2xl shadow-forest/20 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-forest/95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18}/>
            ) : (
              <Save size={18} className="text-harvest" />
            )}
            Commit to Ledger
          </button>
        </form>
      </div>
    </div>
  )
}
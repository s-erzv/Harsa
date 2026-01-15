"use client"
import React, { useState } from 'react'
import { X, Loader2, Save, Calendar, Tag, MessageSquare, Plus, Database, Cpu, Zap, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

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
    if (!formData.product_id) return toast.error("Select a target asset node")
    
    setIsSubmitting(true)
    const toastId = toast.loading("Committing log to traceability layer...")
    
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
      
      toast.success("Log synchronized with ledger", { id: toastId })
      onSuccess()
      onClose()
      setFormData({ product_id: '', activity_name: '', description: '', logged_at: new Date().toISOString().split('T')[0] })
    } catch (err) {
      toast.error("Protocol error: " + err.message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-background/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-500 font-raleway max-h-[95vh] flex flex-col border-t md:border border-border">
        
        <div className="bg-forest dark:bg-harvest/10 p-6 md:p-8 text-white dark:text-harvest relative shrink-0">
          <div className="flex justify-between items-center relative z-10">
            <div className="text-left">
              <h2 className="text-2xl font-bold tracking-tighter italic lowercase">Synchronize Log<span className="text-harvest">.</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Traceability Protocol Node</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/10 dark:bg-harvest/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
            >
              <X size={20}/>
            </button>
          </div>
          <Database className="absolute -right-4 -bottom-4 text-white/5 dark:text-harvest/5 w-32 h-32 rotate-12 pointer-events-none" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar text-left bg-card">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone/40 dark:text-stone/50 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <Tag size={12} className="text-harvest"/> Target Asset Node
            </label>
            <div className="relative">
              <select 
                required
                className="w-full p-4 pl-5 rounded-2xl bg-muted border border-border outline-none font-bold text-sm text-foreground focus:border-harvest transition-all appearance-none cursor-pointer italic"
                value={formData.product_id}
                onChange={e => setFormData({...formData, product_id: e.target.value})}
              >
                <option value="" className="font-normal opacity-50">Select Active SKU</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900 dark:text-white bg-white text-slate-900">{p.name}</option>
                ))}
              </select>
              <Plus className="absolute right-4 top-1/2 -translate-y-1/2 text-stone/30 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone/40 dark:text-stone/50 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                <Calendar size={12} className="text-harvest"/> Timestamp
              </label>
              <input 
                type="date"
                required
                className="w-full p-4 rounded-2xl bg-muted border border-border outline-none font-bold text-sm focus:border-harvest transition-all text-foreground"
                value={formData.logged_at}
                onChange={e => setFormData({...formData, logged_at: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone/40 dark:text-stone/50 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                <Zap size={12} className="text-harvest"/> Operation
              </label>
              <input 
                required
                placeholder="e.g. Fertilization"
                className="w-full p-4 rounded-2xl bg-muted border border-border outline-none text-sm font-bold italic focus:border-harvest transition-all text-foreground placeholder:opacity-30"
                value={formData.activity_name}
                onChange={e => setFormData({...formData, activity_name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone/40 dark:text-stone/50 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <MessageSquare size={12} className="text-harvest"/> Protocol Description
            </label>
            <textarea 
              placeholder="Enter cryptographic evidence of operation..."
              className="w-full p-4 rounded-2xl bg-muted border border-border outline-none text-sm font-medium h-28 focus:border-harvest transition-all resize-none text-foreground italic placeholder:opacity-30"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="p-5 rounded-[2rem] bg-muted border border-border border-dashed group hover:border-harvest/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-card rounded-xl border border-border text-harvest">
                <Cpu size={20} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-harvest uppercase tracking-[0.2em]">Hardware Expansion</p>
                <h4 className="text-xs font-bold text-foreground italic">IoT Node Integration</h4>
                <p className="text-[10px] text-stone/50 leading-relaxed italic">
                  Soon, sensors will automatically synchronize biometric and environmental data to this ledger.
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full py-5 bg-forest dark:bg-harvest text-white rounded-[2rem] font-black text-[11px] tracking-[0.3em] uppercase shadow-2xl shadow-forest/20 dark:shadow-harvest/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18}/>
            ) : (
              <Sparkles size={18} />
            )}
            Authorize Ledger Sync
          </button>
        </form>
      </div>
    </div>
  )
}
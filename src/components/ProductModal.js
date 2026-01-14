"use client"
import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Loader2, Leaf, Tag, Database, Save, Package, Camera, Image as ImageIcon, Coins } from 'lucide-react'
import { getMarketRates } from '@/utils/blockchain'
import { toast } from 'sonner'
import { Button } from './ui/button'

export default function ProductModal({ isOpen, onClose, user, supabase, onSuccess, initialData = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rates, setRates] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Rice',
    price_per_kg: '',
    stock_kg: '',
    description: '',
    image_url: ''
  })
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadRates = async () => {
      const data = await getMarketRates()
      setRates(data)
    }
    loadRates()

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Rice',
        price_per_kg: initialData.price_per_kg || '',
        stock_kg: initialData.stock_kg || '',
        description: initialData.description || '',
        image_url: initialData.image_url || ''
      })
    } else { 
      setFormData({ name: '', category: 'Rice', price_per_kg: '', stock_kg: '', description: '', image_url: '' })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const toastId = toast.loading("Uploading image to IPFS nodes...")
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      toast.success("Image secured!", { id: toastId })
    } catch (err) {
      toast.error("Upload failed: " + err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const toastId = toast.loading("Registering harvest on network...")
    
    try {
      const payload = {
        ...formData,
        seller_id: user.id,
        price_per_kg: parseFloat(formData.price_per_kg),
        stock_kg: parseFloat(formData.stock_kg)
      }

      const { error } = initialData 
        ? await supabase.from('products').update(payload).eq('id', initialData.id)
        : await supabase.from('products').insert([payload])

      if (error) throw error
      
      toast.success(initialData ? "Harvest Updated" : "Harvest Registered", { id: toastId })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      toast.error("Error: " + err.message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const usdValue = rates && formData.price_per_kg 
    ? (parseFloat(formData.price_per_kg) * rates.ethToUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : "$0.00"

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-background/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-lg rounded-t-[3rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-500 font-raleway max-h-[95vh] flex flex-col border-t md:border border-border">
        
        <div className="bg-forest dark:bg-harvest/10 p-6 md:p-8 relative shrink-0">
          <div className="flex justify-between items-center relative z-10 text-white dark:text-harvest">
            <div className="text-left">
              <h2 className="text-2xl font-bold tracking-tighter italic">
                {initialData ? 'Update Ledger' : 'New Harvest'}
              </h2>
              <p className="text-[10px] md:text-xs tracking-widest uppercase opacity-70 font-bold">Node Identity Registration</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 dark:hover:bg-harvest/10 rounded-2xl transition-all active:scale-90">
              <X size={24} />
            </button>
          </div>
          <Leaf className="absolute -bottom-6 -right-6 text-white/5 dark:text-harvest/5 w-32 h-32 rotate-12" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar text-left bg-card">
          
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-stone/40 dark:text-stone/50 uppercase tracking-widest ml-1">Asset Visualization</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video w-full rounded-[2rem] bg-muted border-2 border-dashed border-border hover:border-harvest/50 transition-all cursor-pointer overflow-hidden group flex flex-col items-center justify-center"
            >
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone/30">
                  {uploading ? <Loader2 className="animate-spin text-harvest" size={32} /> : <ImageIcon size={48} strokeWidth={1} />}
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Link asset image</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone/40 dark:text-stone/50 uppercase tracking-widest ml-1 text-left">Commodity Name</label>
              <input 
                required type="text" value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full px-6 py-4 rounded-2xl bg-muted border border-border focus:border-harvest outline-none transition font-bold text-foreground italic placeholder:font-normal" 
                placeholder="e.g. Organic Black Rice" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone/40 dark:text-stone/50 uppercase tracking-widest ml-1">Category</label>
                <div className="relative">
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-6 py-4 rounded-2xl bg-muted border border-border appearance-none focus:border-harvest outline-none transition font-bold text-foreground cursor-pointer"
                  >
                    <option>Rice</option><option>Vegetables</option><option>Fruits</option><option>Spices</option><option>Others</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone/40 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone/40 dark:text-stone/50 uppercase tracking-widest ml-1">Available Stock (kg)</label>
                <input 
                  required type="number" value={formData.stock_kg} 
                  onChange={e => setFormData({...formData, stock_kg: e.target.value})} 
                  className="w-full px-6 py-4 rounded-2xl bg-muted border border-border focus:border-harvest outline-none transition font-bold text-foreground" 
                  placeholder="0" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 p-6 rounded-[2rem] bg-harvest/5 border border-harvest/20">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-harvest uppercase tracking-widest ml-1 flex items-center gap-2">
                <Coins size={14} /> Price per kg (ETH)
              </label>
              <span className="text-[9px] font-bold text-stone/40 italic">Live conversion enabled</span>
            </div>
            
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-harvest font-bold text-lg">Ξ</span>
              <input 
                required type="number" step="0.0001" value={formData.price_per_kg} 
                onChange={e => setFormData({...formData, price_per_kg: e.target.value})} 
                className="w-full pl-12 pr-6 py-5 rounded-2xl bg-card border border-harvest/30 focus:border-harvest focus:ring-4 focus:ring-harvest/5 outline-none transition text-xl font-bold text-foreground tabular-nums" 
                placeholder="0.0000" 
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center px-2">
              <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest">Market Value Estimate</p>
              <p className="text-sm font-bold text-harvest italic">≈ {usdValue} USD</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
            <button 
              type="button" onClick={onClose}
              className="w-full md:flex-1 py-4 px-6 rounded-2xl text-stone/50 font-bold text-xs uppercase tracking-widest hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <Button 
              disabled={isSubmitting || uploading}
              className="w-full md:flex-[2] h-16 bg-forest dark:bg-harvest text-white font-bold text-sm tracking-[0.2em] uppercase shadow-2xl shadow-forest/20 dark:shadow-harvest/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {initialData ? 'Update Ledger' : 'Authorize Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
"use client"
import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Loader2, Leaf, Tag, Database, DollarSign, Save, Package, Camera, Image as ImageIcon } from 'lucide-react'

export default function ProductModal({ isOpen, onClose, user, supabase, onSuccess, initialData = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Beras',
    price_per_kg: '',
    stock_kg: '',
    description: '',
    image_url: ''
  })
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Beras',
        price_per_kg: initialData.price_per_kg || '',
        stock_kg: initialData.stock_kg || '',
        description: initialData.description || '',
        image_url: initialData.image_url || ''
      })
    } else { 
      setFormData({ name: '', category: 'Beras', price_per_kg: '', stock_kg: '', description: '', image_url: '' })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
    } catch (err) {
      alert("Gagal upload gambar: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const payload = {
      ...formData,
      seller_id: user.id,
      price_per_kg: parseFloat(formData.price_per_kg),
      stock_kg: parseFloat(formData.stock_kg)
    }

    try {
      let error
      if (initialData) { 
        const { error: editError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', initialData.id)
        error = editError
      } else { 
        const { error: addError } = await supabase
          .from('products')
          .insert([payload])
        error = addError
      }

      if (error) throw error
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div 
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300 font-raleway max-h-[95vh] flex flex-col">
        
        <div className="bg-forest p-6 md:p-8 text-white relative shrink-0">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                {initialData ? 'Ubah Data Produk' : 'Daftarkan Hasil Panen'}
              </h2>
              <p className="text-emerald-100/70 text-xs md:text-sm mt-1">
                Lengkapi informasi detail komoditas Anda.
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <Leaf className="absolute -bottom-6 -right-6 text-white/5 w-24 h-24 md:w-32 md:h-32 rotate-12" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar">
          
          <div className="space-y-3">
            <label className="text-[10px] md:text-[11px] font-bold text-stone uppercase tracking-wider flex items-center gap-2 ml-1">
              <ImageIcon size={13} className="text-harvest" /> Foto Komoditas
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video w-full rounded-3xl bg-chalk border-2 border-dashed border-stone-200 hover:border-forest/30 transition-all cursor-pointer overflow-hidden group flex flex-col items-center justify-center"
            >
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone/30">
                  {uploading ? (
                    <Loader2 className="animate-spin text-forest" size={32} />
                  ) : (
                    <>
                      <ImageIcon size={48} strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Ketuk untuk Unggah</p>
                    </>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] md:text-[11px] font-bold text-stone uppercase tracking-wider flex items-center gap-2 ml-1">
              <Tag size={13} className="text-harvest" /> Nama Hasil Bumi
            </label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full px-5 py-3.5 md:py-4 rounded-2xl bg-chalk/40 border border-stone/10 focus:border-forest/30 focus:ring-4 focus:ring-forest/5 outline-none transition text-sm text-slate-700 font-medium" 
              placeholder="Contoh: Beras Mentik Susu" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-[11px] font-bold text-stone uppercase tracking-wider flex items-center gap-2 ml-1">
                <Database size={13} className="text-harvest" /> Jenis
              </label>
              <div className="relative">
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full px-5 py-3.5 md:py-4 rounded-2xl bg-chalk/40 border border-stone/10 appearance-none focus:border-forest/30 outline-none transition text-sm text-slate-700 cursor-pointer font-semibold"
                >
                  <option>Beras</option>
                  <option>Sayuran</option>
                  <option>Buah</option>
                  <option>Rempah</option>
                  <option>Lainnya</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone/40 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] md:text-[11px] font-bold text-stone uppercase tracking-wider flex items-center gap-2 ml-1">
                <Package size={13} className="text-harvest" /> Stok (kg)
              </label>
              <input 
                required 
                type="number" 
                value={formData.stock_kg} 
                onChange={e => setFormData({...formData, stock_kg: e.target.value})} 
                className="w-full px-5 py-3.5 md:py-4 rounded-2xl bg-chalk/40 border border-stone/10 focus:border-forest/30 outline-none transition text-sm text-slate-700 font-bold" 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] md:text-[11px] font-bold text-stone uppercase tracking-wider flex items-center gap-2 ml-1">
              <DollarSign size={13} className="text-harvest" /> Harga Jual per kg
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
              <input 
                required 
                type="number" 
                value={formData.price_per_kg} 
                onChange={e => setFormData({...formData, price_per_kg: e.target.value})} 
                className="w-full pl-12 pr-5 py-3.5 md:py-4 rounded-2xl bg-chalk/40 border border-stone/10 focus:border-forest/30 outline-none transition text-sm text-slate-700 font-bold" 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="w-full md:flex-1 py-4 px-6 rounded-2xl text-stone font-bold text-sm hover:bg-chalk transition-all border border-stone/5"
            >
              Batal
            </button>
            <button 
              disabled={isSubmitting || uploading}
              className="w-full md:flex-[2] py-4 px-6 bg-forest text-white rounded-2xl font-bold text-sm shadow-xl shadow-forest/20 hover:bg-forest/90 transition active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>{initialData ? 'Simpan Perubahan' : 'Daftarkan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
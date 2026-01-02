"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext' 
import { 
  User, MapPin, ShieldCheck, Mail, Wallet, Loader2, 
  Link as LinkIcon, RefreshCcw, Award, Package, Star, 
  ExternalLink, Edit2, ChevronRight, Camera, TrendingUp, DollarSign, X
} from 'lucide-react'
import { createWalletClient, custom } from 'viem'
import { polygonAmoy } from 'viem/chains'
import { Button } from "@/components/ui/button"

export default function ProfilPage() {
  const { user, supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ total_products: 0, total_sales: 0, revenue: 0, rating: 4.8 })
  const [loading, setLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [editForm, setEditForm] = useState({ full_name: '', bio: '', location: '' })

  useEffect(() => {
    if (user) fetchProfileData()
  }, [user])

const fetchProfileData = async () => {
  try {
    const [profRes, prodCount, salesRes] = await Promise.all([ 
      supabase.from('profiles').select('*, bio, location').eq('id', user.id).single(),
      supabase.from('products').select('id', { count: 'exact' }).eq('seller_id', user.id),
      supabase.from('transactions')
        .select('total_price, amount_kg')
        .eq('seller_id', user.id)
        .eq('status', 'COMPLETED')
    ])
    
    if (profRes.error) throw profRes.error;

    setProfile(profRes.data) 
    setEditForm({
      full_name: profRes.data?.full_name || '',
      location: profRes.data?.location || 'Jawa Barat, Indonesia',
      bio: profRes.data?.bio || ''
    })

      const totalRevenue = salesRes.data?.reduce((acc, curr) => acc + curr.total_price, 0) || 0
      const totalKilo = salesRes.data?.reduce((acc, curr) => acc + curr.amount_kg, 0) || 0

      setStats({
        total_products: prodCount.count || 0,
        total_sales: totalKilo,
        revenue: totalRevenue,
        rating: 4.9
      })
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleUploadAvatar = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return

      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Math.random()}.${fileExt}`
 
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
 
      const finalUrl = `${publicUrl}?t=${new Date().getTime()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      await fetchProfileData()
      alert("Foto profil berhasil diperbarui!")
    } catch (error) { 
      console.error(error)
      alert("Gagal upload: " + error.message) 
    } finally { 
      setUploading(false) 
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').update(editForm).eq('id', user.id)
      if (error) throw error
      setIsEditModalOpen(false)
      fetchProfileData()
    } catch (error) { alert(error.message) } finally { setLoading(false) }
  }

  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert("Instal MetaMask dulu ya Pak/Bu!")
    setIsConnecting(true)
    try {
      const walletClient = createWalletClient({ chain: polygonAmoy, transport: custom(window.ethereum) })
      const [address] = await walletClient.requestAddresses()
      await supabase.from('profiles').update({ wallet_address: address }).eq('id', user.id)
      fetchProfileData()
    } catch (err) { alert(err.message) } finally { setIsConnecting(false) }
  }

  if (loading && !profile) return (
    <div className="h-screen flex items-center justify-center bg-chalk">
      <Loader2 className="animate-spin text-forest" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-white font-raleway pb-32"> 
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 md:space-y-10">
         
        <div className="relative bg-forest rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 text-white overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full flex items-center justify-center border-4 md:border-8 border-white/10 backdrop-blur-md overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={60} className="text-emerald-100/30 md:size-20" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 bg-harvest p-2.5 md:p-3 rounded-full border-4 border-forest shadow-lg hover:bg-clay transition-colors"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} className="text-forest" />}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} className="hidden" accept="image/*" />
            </div>

            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{profile?.full_name}</h1>
                <p className="text-emerald-100/60 mt-1 md:mt-2 font-medium text-sm md:text-base">
                  {profile?.bio || "Petani Harsa Digital"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4 md:mt-6">
                  <Badge icon={<ShieldCheck size={14} />} label="Terverifikasi" color="bg-white/10" />
                  <Badge icon={<Star size={14} className="fill-yellow-400 text-yellow-400" />} label={`${stats.rating} Reputasi`} color="bg-white/10" />
                </div>
              </div>
            </div>
          </div>
          <ShieldCheck size={300} className="absolute -right-24 -bottom-24 text-white/5 rotate-12 pointer-events-none hidden md:block" />
        </div>
 
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={<Package className="text-forest"/>} label="Produk" value={stats.total_products} />
          <StatCard icon={<TrendingUp className="text-emerald-600"/>} label="Terjual" value={`${stats.total_sales} Kg`} />
          <StatCard icon={<DollarSign className="text-harvest"/>} label="Omzet" value={`Rp ${stats.revenue.toLocaleString('id-ID')}`} />
          <StatCard icon={<Star className="text-yellow-500 fill-yellow-500"/>} label="Rating" value={stats.rating} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <section className="bg-white rounded-[2rem] md:rounded-[3rem] border border-clay p-6 md:p-10 shadow-sm space-y-8 md:space-y-10">
              <h3 className="text-xs font-bold text-stone uppercase tracking-widest border-b border-clay pb-4">Data Akun</h3>
              <div className="space-y-6">
                <ProfileItem icon={<Mail size={20}/>} label="Email Terdaftar" value={user.email} />
                <ProfileItem icon={<MapPin size={20}/>} label="Wilayah Distribusi" value={profile?.location || "Jawa Barat, Indonesia"} />
              </div>
            </section>

          <section className="bg-chalk rounded-[2rem] md:rounded-[3rem] border border-clay p-6 md:p-10 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
              <div className="flex items-center gap-4 md:gap-6 self-start md:self-auto flex-1 min-w-0">
                <div className="p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl shadow-xl border border-clay/50 shrink-0">
                  <Wallet className={`${profile?.wallet_address ? "text-forest" : "text-stone/20"} w-6 h-6 md:w-8 md:h-8`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-stone uppercase tracking-widest">Dompet Blockchain</p>
                   
                  {profile?.wallet_address ? (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(profile.wallet_address);
                        alert("Alamat dompet berhasil disalin!");
                      }}
                      className="group flex items-center gap-2 mt-1 w-full"
                      title="Klik untuk salin alamat"
                    >
                      <p className="text-xs md:text-sm font-mono font-bold text-forest break-all text-left group-hover:text-emerald-600 transition-colors">
                        {profile.wallet_address}
                      </p>
                      <div className="p-1.5 bg-forest/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <LinkIcon size={12} className="text-forest" />
                      </div>
                    </button>
                  ) : (
                    <p className="text-xs md:text-sm font-bold text-stone/40 mt-1 italic">Belum Terhubung</p>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleConnectWallet} 
                disabled={isConnecting} 
                className={`w-full md:w-auto px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold transition-all shadow-xl ${profile?.wallet_address ? 'bg-white text-forest border border-clay hover:bg-clay' : 'bg-forest text-white shadow-forest/20 active:scale-95'}`}
              >
                {isConnecting ? <RefreshCcw size={16} className="animate-spin" /> : <LinkIcon size={16} className="mr-2 inline" />}
                {profile?.wallet_address ? "Ganti Dompet" : "Hubungkan"}
              </button>
            </div>
          </section>
          </div>

          <aside className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-clay p-6 md:p-8 shadow-sm">
              <h4 className="text-[10px] font-bold text-stone uppercase tracking-widest mb-4 md:mb-6 px-2">Aksi Pengguna</h4>
              <div className="space-y-1 md:space-y-2">
                <ActionButton icon={<Edit2 size={16}/>} label="Ubah Profil" onClick={() => setIsEditModalOpen(true)} />
                <ActionButton icon={<RefreshCcw size={16}/>} label="Sinkronisasi Data" onClick={fetchProfileData} />
                <ActionButton icon={<ExternalLink size={16}/>} label="Polygonscan" disabled={!profile?.wallet_address} />
              </div>
            </div>
          </aside>
        </div>
      </main>
 
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-forest/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-forest uppercase tracking-tighter italic text-justify">Edit Profil</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-stone"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-bold text-stone uppercase ml-2">Nama Lengkap</label>
                <input required className="w-full p-4 bg-chalk rounded-2xl border border-clay focus:ring-4 focus:ring-forest/5 outline-none font-bold text-sm" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-bold text-stone uppercase ml-2">Lokasi Lahan</label>
                <input className="w-full p-4 bg-chalk rounded-2xl border border-clay focus:ring-4 focus:ring-forest/5 outline-none font-bold text-sm" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-bold text-stone uppercase ml-2">Bio Singkat</label>
                <textarea className="w-full p-4 bg-chalk rounded-2xl border border-clay focus:ring-4 focus:ring-forest/5 outline-none font-medium h-24 text-sm" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-forest h-12 md:h-14 rounded-2xl font-bold shadow-xl shadow-forest/20 text-white">Simpan Perubahan</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-clay shadow-sm flex flex-col items-center text-center gap-1 md:gap-2 group hover:shadow-md transition-all">
      <div className="p-2 md:p-3 bg-chalk rounded-xl md:rounded-2xl mb-1 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-[8px] md:text-[10px] font-bold text-stone uppercase tracking-widest">{label}</p>
      <p className="text-sm md:text-xl font-bold text-forest tracking-tight truncate w-full">{value}</p>
    </div>
  )
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 md:gap-6 group">
      <div className="p-3 md:p-5 bg-chalk rounded-xl md:rounded-3xl border border-clay group-hover:bg-white transition-colors shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-stone uppercase tracking-widest mb-0.5 md:mb-1">{label}</p>
        <p className="text-xs md:text-sm font-bold text-slate-800 break-words">{value}</p>
      </div>
    </div>
  )
}

function Badge({ icon, label, color }) {
  return (
    <span className={`${color} text-[8px] md:text-[10px] font-bold uppercase px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 backdrop-blur-sm flex items-center gap-1.5 md:gap-2`}>
      {icon} {label}
    </span>
  )
}

function ActionButton({ icon, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-transparent hover:border-clay hover:bg-chalk transition-all text-stone hover:text-forest disabled:opacity-30">
      <div className="flex items-center gap-3 font-bold text-[9px] md:text-[11px] uppercase tracking-wider">
        {icon} <span className="truncate">{label}</span>
      </div>
      <ChevronRight size={14} className="shrink-0" />
    </button>
  )
}
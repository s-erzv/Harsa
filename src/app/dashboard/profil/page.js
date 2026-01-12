"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext' 
import { 
  User, MapPin, ShieldCheck, Mail, Wallet, Loader2, 
  Link as LinkIcon, RefreshCcw, Award, Package, Star, 
  ExternalLink, Edit2, ChevronRight, Camera, TrendingUp, DollarSign, X, Check, Cpu
} from 'lucide-react'
import { createWalletClient, custom } from 'viem'
import { arbitrum } from 'viem/chains'
import { Button } from "@/components/ui/button"

export default function ProfilPage() {
  const { user, supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ total_products: 0, total_sales: 0, revenue: 0, rating: 4.9 })
  const [loading, setLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const fileInputRef = useRef(null)

  const [editForm, setEditForm] = useState({ full_name: '', bio: '', location: '' })

  useEffect(() => {
    if (user) fetchProfileData()
  }, [user])

  const fetchProfileData = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true)
    try {
      const [profRes, prodCount, salesRes] = await Promise.all([ 
        supabase.from('profiles').select('*, bio, location').eq('id', user.id).single(),
        supabase.from('products').select('id', { count: 'exact' }).eq('seller_id', user.id),
        supabase.from('transactions')
          .select('total_price, amount_kg')
          .eq('seller_id', user.id)
          .eq('status', 'COMPLETE')
      ])
      
      if (profRes.error) throw profRes.error;

      setProfile(profRes.data) 
      setEditForm({
        full_name: profRes.data?.full_name || '',
        location: profRes.data?.location || 'West Java, Indonesia',
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
      if (isManualSync) alert("Ledger synced successfully!")
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false)
      setSyncing(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUploadAvatar = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const finalUrl = `${publicUrl}?t=${new Date().getTime()}`
      await supabase.from('profiles').update({ avatar_url: finalUrl }).eq('id', user.id)
      fetchProfileData()
      alert("Profile picture updated!")
    } catch (error) { 
      alert("Upload failed: " + error.message) 
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
    if (!window.ethereum) return alert("Please install MetaMask first!")
    setIsConnecting(true)
    try {
      const walletClient = createWalletClient({ chain: arbitrum, transport: custom(window.ethereum) })
      const [address] = await walletClient.requestAddresses()
      await supabase.from('profiles').update({ wallet_address: address }).eq('id', user.id)
      fetchProfileData()
    } catch (err) { alert(err.message) } finally { setIsConnecting(false) }
  }

  if (loading && !profile) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-white font-raleway pb-32"> 
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 md:space-y-12 text-left">
        <div className="relative bg-forest rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 text-white overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-44 md:h-44 bg-white/10 rounded-full flex items-center justify-center border-4 md:border-8 border-white/10 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-700 group-hover:scale-105">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-emerald-100/30 w-16 h-16 md:w-20 md:h-20" />
                )}
              </div>
              <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="absolute bottom-1 right-1 bg-harvest p-3 md:p-4 rounded-full border-4 border-forest shadow-lg hover:bg-clay transition-all active:scale-90">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} className="text-forest" />}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} className="hidden" accept="image/*" />
            </div>
            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter italic uppercase">{profile?.full_name}</h1>
                <p className="text-emerald-100/60 mt-2 font-medium text-sm md:text-lg italic lowercase max-w-lg leading-relaxed">
                  {profile?.bio || "digital merchant at harsa network"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                  <Badge icon={<ShieldCheck size={14} />} label="Verified node" color="bg-white/10" />
                  <Badge icon={<Star size={14} className="fill-yellow-400 text-yellow-400" />} label={`${stats.rating} reputation`} color="bg-white/10" />
                </div>
              </div>
            </div>
          </div>
          <ShieldCheck size={400} className="absolute -right-32 -bottom-32 text-white/5 rotate-12 pointer-events-none hidden md:block" />
        </div>
 
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={<Package size={22} className="text-forest"/>} label="Inventory" value={`${stats.total_products} SKUs`} />
          <StatCard icon={<TrendingUp size={22} className="text-emerald-600"/>} label="Total sold" value={`${stats.total_sales} kg`} />
          <StatCard icon={<DollarSign size={22} className="text-harvest"/>} label="Revenue" value={`$${(stats.revenue/15600).toFixed(2)}`} />
          <StatCard icon={<Star size={22} className="text-yellow-500 fill-yellow-500"/>} label="Rating" value={stats.rating} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-clay p-8 md:p-12 shadow-sm space-y-10">
              <h3 className="text-[10px] font-bold text-stone uppercase tracking-[0.3em] border-b border-clay pb-6">Identity details</h3>
              <div className="space-y-8">
                <ProfileItem icon={<Mail size={22} className="text-forest"/>} label="Merchant email" value={user.email} />
                <ProfileItem icon={<MapPin size={22} className="text-forest"/>} label="Global distribution" value={profile?.location || "West Java, Indonesia"} />
              </div>
            </section>

            <section className="bg-chalk/30 rounded-[2.5rem] border border-clay p-8 md:p-12 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6 self-start md:self-auto flex-1 min-w-0">
                  <div className="p-5 md:p-6 bg-white rounded-3xl shadow-xl border border-clay/50 shrink-0 group-hover:scale-105 transition-transform">
                    <Wallet className={`${profile?.wallet_address ? "text-forest" : "text-stone/20"} w-8 h-8`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">Arbitrum L2 address</p>
                    {profile?.wallet_address ? (
                      <button onClick={() => handleCopy(profile.wallet_address)} className="group flex items-center gap-2 w-full" title="Click to copy">
                        <p className="text-xs md:text-sm font-mono font-bold text-forest break-all text-left group-hover:text-emerald-600 transition-colors">{profile.wallet_address}</p>
                        <div className="p-1.5 bg-forest/5 rounded-lg shrink-0">
                          {copied ? <Check size={12} className="text-emerald-600" /> : <LinkIcon size={12} className="text-forest opacity-40 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </button>
                    ) : ( <p className="text-xs md:text-sm font-bold text-stone/40 italic">not initialized</p> )}
                  </div>
                </div>
                <button onClick={handleConnectWallet} disabled={isConnecting} className={`w-full md:w-auto px-8 py-4 rounded-2xl text-[10px] font-bold transition-all shadow-xl active:scale-95 uppercase tracking-widest ${profile?.wallet_address ? 'bg-white text-forest border border-clay hover:bg-clay' : 'bg-forest text-white shadow-forest/20'}`}>
                  {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} className="mr-2 inline" />}
                  {profile?.wallet_address ? "Switch wallet" : "Connect node"}
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-clay p-8 shadow-sm">
              <h4 className="text-[10px] font-bold text-stone uppercase tracking-widest mb-8 px-2">Merchant actions</h4>
              <div className="space-y-2">
                <ActionButton icon={<Edit2 size={16}/>} label="Update profile" onClick={() => setIsEditModalOpen(true)} />
                <ActionButton 
                  icon={syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16}/>} 
                  label={syncing ? "Syncing node..." : "Manual sync"} 
                  onClick={() => fetchProfileData(true)} 
                  disabled={syncing}
                />
                <ActionButton 
                  icon={<ExternalLink size={16}/>} 
                  label="Arbiscan" 
                  disabled={!profile?.wallet_address} 
                  onClick={() => window.open(`https://arbiscan.io/address/${profile?.wallet_address}`, '_blank')}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-forest/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-forest uppercase tracking-tighter italic">Edit identity</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-chalk rounded-full text-stone active:scale-90 transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-stone uppercase ml-2 tracking-widest">Legal name</label>
                <input required className="w-full p-4 bg-chalk rounded-2xl border border-clay focus:ring-4 focus:ring-forest/5 outline-none font-bold text-sm" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-stone uppercase ml-2 tracking-widest">Base location</label>
                <input className="w-full p-4 bg-chalk rounded-2xl border border-clay focus:ring-4 focus:ring-forest/5 outline-none font-bold text-sm" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-stone uppercase ml-2 tracking-widest">Short biography</label>
                <textarea className="w-full p-4 bg-chalk rounded-2xl border border-clay focus:ring-4 focus:ring-forest/5 outline-none font-medium h-24 text-sm italic" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-forest h-14 rounded-2xl font-bold shadow-xl shadow-forest/20 text-white uppercase tracking-widest mt-4 active:scale-95 transition-all">Save identity</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-clay shadow-sm flex flex-col items-center text-center gap-3 group hover:shadow-xl transition-all duration-500">
      <div className="bg-chalk p-4 rounded-2xl group-hover:bg-forest group-hover:text-chalk transition-colors">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold text-stone uppercase tracking-widest opacity-60">{label}</p>
        <p className="text-lg md:text-xl font-bold text-forest tracking-tighter italic tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-6">
      <div className="bg-chalk p-4 md:p-5 rounded-[1.5rem] md:rounded-[2.5rem] border border-clay shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-base font-bold text-slate-800 break-words italic">{value}</p>
      </div>
    </div>
  )
}

function Badge({ icon, label, color }) {
  return (
    <span className={`${color} text-[10px] font-bold uppercase px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm flex items-center gap-2 italic tracking-widest`}>
      {icon} {label}
    </span>
  )
}

function ActionButton({ icon, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-clay hover:bg-chalk transition-all text-stone hover:text-forest disabled:opacity-30 group">
      <div className="flex items-center gap-3 font-bold text-[11px] uppercase tracking-[0.1em]">
        <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>
        <span className="truncate italic">{label}</span>
      </div>
      <ChevronRight size={14} className="shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
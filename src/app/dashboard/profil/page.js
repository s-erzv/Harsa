"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext' 
import { 
  User, MapPin, ShieldCheck, Mail, Wallet, Loader2, 
  Link as LinkIcon, RefreshCcw, Package, Star, 
  ExternalLink, Edit2, ChevronRight, Camera, TrendingUp, DollarSign, X, Check, Cpu, Navigation
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
  const autocompleteInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  const [editForm, setEditForm] = useState({ 
    full_name: '', 
    bio: '', 
    location: '', 
    latitude: null, 
    longitude: null 
  })

  useEffect(() => {
    if (user) fetchProfileData()
  }, [user])

  useEffect(() => {
    if (isEditModalOpen && window.google) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['geocode'],
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace()
        if (place.geometry) {
          setEditForm(prev => ({
            ...prev,
            location: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          }))
        }
      })
    }
  }, [isEditModalOpen])

  const fetchProfileData = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true)
    try {
      const [profRes, prodCount, salesRes] = await Promise.all([ 
        supabase.from('profiles').select('*').eq('id', user.id).single(),
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
        location: profRes.data?.location || '',
        bio: profRes.data?.bio || '',
        latitude: profRes.data?.latitude || null,
        longitude: profRes.data?.longitude || null
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
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      fetchProfileData()
    } catch (error) { alert(error.message) } finally { setUploading(false) }
  }

  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask first!");
    
    setIsConnecting(true);
    try {
      // 1. Minta permission untuk akses akun (Ini yang bikin modal "Switch" muncul)
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // 2. Ambil alamat akun yang baru dipilih
      const [address] = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // 3. Update ke Database Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: address })
        .eq('id', user.id);

      if (error) throw error;

      // 4. Refresh data UI
      await fetchProfileData();
      alert("Wallet successfully linked: " + address.slice(0, 6) + "..." + address.slice(-4));
      
    } catch (err) {
      console.error(err);
      if (err.code !== 4001) {
        alert("Connection failed: " + err.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading && !profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-forest" /></div>

  return (
    <div className="min-h-screen bg-white font-raleway pb-32"> 
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 md:space-y-12 text-left">
        <div className="relative bg-forest rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 text-white overflow-hidden shadow-2xl group border border-white/5">
            
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-30">
              <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-harvest/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-clay/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
              
              <div className="relative shrink-0">
                <div className="relative w-36 h-36 md:w-52 md:h-52">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-harvest/30 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full border border-white/10" />
                  
                  <div className="absolute inset-4 bg-forest-light/40 rounded-full flex items-center justify-center border-4 md:border-8 border-white/10 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.2)] transition-all duration-700 group-hover:scale-[1.02]">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <User className="text-emerald-100/20 w-16 h-16 md:w-24 md:h-24" />
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={uploading} 
                  className="absolute bottom-4 right-4 bg-harvest text-forest p-3.5 md:p-5 rounded-2xl border-4 border-forest shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:bg-clay hover:-translate-y-1 transition-all active:scale-90 z-20 group/btn"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} className="group-hover/btn:rotate-12 transition-transform" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} className="hidden" accept="image/*" />
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-harvest animate-ping" />
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-emerald-100/60">Active</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl md:text-7xl font-bold tracking-tight  leading-[0.9]">
                    {profile?.full_name}
                    <span className="text-harvest block md:inline md:ml-4">.</span>
                  </h1>
                  <p className="text-emerald-100/70 font-medium  lowercase max-w-xl text-base md:text-xl leading-relaxed tracking-tight">
                    {profile?.bio || "digital merchant at harsa network, cultivating transparency through decentralization."}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-1">
                  <Badge 
                    icon={<ShieldCheck size={16} className="text-harvest" />} 
                    label="Verified Infrastructure" 
                    color="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-default" 
                  />
                  <Badge 
                    icon={<MapPin size={16} className="text-harvest" />} 
                    label={profile?.location || "Planet Earth"} 
                    color="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-default" 
                  />
                </div>
              </div>
            </div>

            <ShieldCheck size={480} className="absolute -right-24 -bottom-24 text-white/[0.03] -rotate-12 pointer-events-none" />
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
              <h3 className="text-[10px] font-bold text-stone tracking-[0.3em] border-b border-clay pb-6">Identity details</h3>
              <div className="space-y-8">
                <ProfileItem icon={<Mail size={22} className="text-forest"/>} label="Merchant email" value={user.email} />
                <ProfileItem icon={<MapPin size={22} className="text-forest"/>} label="Global distribution" value={profile?.location || "Not set"} />
                {/* {profile?.latitude && (
                  <ProfileItem icon={<Navigation size={22} className="text-forest"/>} label="Geographic Node" value={`${profile.latitude}, ${profile.longitude}`} />
                )} */}
              </div>
            </section>

            <section className="bg-chalk/30 rounded-[2.5rem] border border-clay p-8 md:p-12 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="p-5 md:p-6 bg-white rounded-3xl shadow-xl border border-clay/50">
                    <Wallet className={`${profile?.wallet_address ? "text-forest" : "text-stone/20"} w-8 h-8`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-stone tracking-widest mb-1 text-left">Arbitrum L2 address</p>
                    {profile?.wallet_address ? (
                      <button onClick={() => handleCopy(profile.wallet_address)} className="flex items-center gap-2 w-full">
                        <p className="text-xs md:text-sm font-mono font-bold text-forest break-all text-left">{profile.wallet_address}</p>
                        {copied ? <Check size={12} className="text-emerald-600" /> : <LinkIcon size={12} className="text-forest opacity-40" />}
                      </button>
                    ) : ( <p className="text-xs md:text-sm font-bold text-stone/40 ">not initialized</p> )}
                  </div>
                </div>
                <button 
                  onClick={handleConnectWallet} 
                  disabled={isConnecting} 
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl text-[10px] font-bold tracking-widest transition-all shadow-xl active:scale-95 uppercase ${
                    profile?.wallet_address 
                      ? 'bg-white text-forest border border-clay hover:bg-forest/5' 
                      : 'bg-forest text-white shadow-forest/20 animate-pulse'
                  }`}
                >
                  {isConnecting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Cpu size={16} className={`mr-2 inline ${profile?.wallet_address ? 'text-harvest' : 'text-white'}`} />
                      {profile?.wallet_address ? "Switch Identity Node" : "Initialize Node"}
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-clay p-8 shadow-sm">
              <h4 className="text-[10px] font-bold text-stone tracking-widest mb-8">Merchant actions</h4>
              <div className="space-y-2">
                <ActionButton icon={<Edit2 size={16}/>} label="Update profile" onClick={() => setIsEditModalOpen(true)} />
                <ActionButton icon={syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16}/>} label="Manual sync" onClick={() => fetchProfileData(true)} disabled={syncing} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-forest tracking-tighter ">Edit identity</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-chalk rounded-full text-stone"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-stone ml-2 tracking-widest">Legal name</label>
                <input required className="w-full p-4 bg-chalk rounded-2xl border border-clay outline-none font-bold text-sm" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-stone ml-2 tracking-widest">Base location (Google Maps)</label>
                <div className="relative">
                  <input 
                    ref={autocompleteInputRef}
                    required 
                    placeholder="Search your city or warehouse..."
                    className="w-full p-4 pl-12 bg-chalk rounded-2xl border border-clay outline-none font-bold text-sm" 
                    value={editForm.location} 
                    onChange={e => setEditForm({...editForm, location: e.target.value})} 
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-forest" size={18} />
                </div>
                {editForm.latitude && (
                  <p className="text-[9px] text-emerald-600 font-bold mt-1 ml-2">✓ Geo-coordinates captured</p>
                )}
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-stone ml-2 tracking-widest">Short biography</label>
                <textarea className="w-full p-4 bg-chalk rounded-2xl border border-clay outline-none font-medium h-24 text-sm " value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-forest h-14 rounded-2xl font-bold shadow-xl shadow-forest/20 text-white tracking-widest mt-4">Save Identity & Node</Button>
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
        <p className="text-[10px] font-bold text-stone tracking-widest opacity-60">{label}</p>
        <p className="text-lg md:text-xl font-bold text-forest tracking-tighter  tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-6">
      <div className="bg-chalk p-4 md:p-5 rounded-[1.5rem] md:rounded-[2.5rem] border border-clay shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-stone tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-base font-bold text-slate-800 break-words ">{value}</p>
      </div>
    </div>
  )
}

function Badge({ icon, label, color }) {
  return (
    <span className={`${color} text-[10px] font-medium px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm flex items-center gap-2  tracking-widest`}>
      {icon} {label}
    </span>
  )
}

function ActionButton({ icon, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-clay hover:bg-chalk transition-all text-stone hover:text-forest disabled:opacity-30 group">
      <div className="flex items-center gap-3 font-bold text-[11px] tracking-[0.1em]">
        <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>
        <span className="truncate ">{label}</span>
      </div>
      <ChevronRight size={14} className="shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
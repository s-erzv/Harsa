"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext' 
import ThemeToggle from '@/components/ThemeToggle'
import { 
  User, MapPin, ShieldCheck, Mail, Wallet, Loader2, 
  Link as LinkIcon, RefreshCcw, Package, Star, 
  Edit2, ChevronRight, Camera, X, Check, Cpu, Trash2, Unlink
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'

export default function ProfilPage() {
  const { user, profile, supabase, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
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

  const isWalletUser = user?.email?.includes('@harsa.network')

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        location: profile.location || '',
        bio: profile.bio || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null
      })
      setLoading(false)
    }
  }, [profile])

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
          toast.success("Coordinates captured from map")
        }
      })
    }
  }, [isEditModalOpen])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    const toastId = toast.loading("Updating node identity...")
    try {
      const { error } = await supabase.from('profiles').update(editForm).eq('id', user.id)
      if (error) throw error
      setIsEditModalOpen(false)
      refreshProfile()
      toast.success("Identity updated successfully", { id: toastId })
    } catch (error) { 
      toast.error(error.message, { id: toastId }) 
    }
  }

  const handleConnectWallet = async () => {
    if (!window.ethereum) return toast.error("Metamask not detected")
    
    setIsConnecting(true)
    const toastId = toast.loading("Authorizing blockchain link...")
    
    try {
      await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: address.toLowerCase() })
        .eq('id', user.id)
      
      if (error) throw error
      
      refreshProfile()
      toast.success(`Node linked: ${address.slice(0, 6)}...`, { id: toastId })
    } catch (err) {
      toast.error("Authorization failed", { id: toastId })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRevokeWallet = async () => {
    toast("Revoke node access?", {
      description: "This will disconnect your identity from the blockchain.",
      action: {
        label: "Revoke",
        onClick: async () => {
          const toastId = toast.loading("Revoking link...")
          try {
            const { error } = await supabase.from('profiles').update({ wallet_address: null }).eq('id', user.id)
            if (error) throw error
            refreshProfile()
            toast.success("Blockchain link revoked", { id: toastId })
          } catch (err) {
            toast.error("Revoke failed", { id: toastId })
          }
        },
      },
    })
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Address copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefreshNode = () => {
    const toastId = toast.loading("Syncing with ledger...")
    refreshProfile()
    setTimeout(() => {
      toast.success("Node synchronized", { id: toastId })
    }, 1000)
  }

  if (loading || !profile) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen text-foreground font-raleway pb-20 transition-colors">
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-10 md:space-y-16">
        
        <section className="relative bg-card rounded-[3rem] p-8 md:p-16 border border-border shadow-lg overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-harvest/30 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-14">
            <div className="relative shrink-0">
              <div className="relative w-40 h-40 md:w-52 md:h-52">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-harvest/20 animate-[spin_30s_linear_infinite]" />
                <div className="absolute inset-4 bg-background rounded-full border-4 border-border overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-stone/20">
                      <User size={64} />
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-2 right-2 bg-harvest text-white p-4 rounded-2xl border-4 border-background shadow-xl hover:scale-110 active:scale-95 transition-all"
              >
                <Camera size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight italic">
                  {profile.full_name}
                </h1>
                <p className="text-stone dark:text-stone-400 font-medium text-lg italic max-w-xl">
                  {profile.bio || "Crafting digital legacies in the decentralized web."}
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Badge variant="secondary" className="bg-harvest/10 text-harvest border-none px-4 py-1.5 rounded-xl gap-2 italic">
                  <Star size={14} className="fill-harvest" /> {profile.reputation_score}% Trust Node
                </Badge>
                <Badge variant="secondary" className="bg-forest/10 text-forest dark:text-clay border-none px-4 py-1.5 rounded-xl gap-2 italic">
                  <MapPin size={14} /> {profile.location || "Earth Node"}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-card rounded-[2.5rem] border-2 border-border p-8 md:p-12 space-y-8 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-5 bg-background rounded-3xl border border-border shadow-inner">
                    <Cpu className={profile.wallet_address ? "text-harvest" : "text-stone/20"} size={32} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] text-stone/40 uppercase leading-none mb-1">Blockchain Identity</h3>
                    <p className="font-bold text-lg dark:text-white italic">Arbitrum Layer-2 Node</p>
                  </div>
                </div>
              </div>

              {profile.wallet_address ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="bg-background border border-border p-5 rounded-2xl flex items-center justify-between group/addr">
                    <p className="font-mono text-xs md:text-sm font-bold truncate pr-4 text-forest dark:text-harvest">
                      {profile.wallet_address}
                    </p>
                    <button onClick={() => handleCopy(profile.wallet_address)} className="p-2 hover:bg-muted rounded-xl transition-all">
                      <LinkIcon size={16} className={copied ? "text-emerald-500" : "text-stone/40"} />
                    </button>
                  </div>
                  <Button 
                    onClick={handleRevokeWallet}
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold transition-all gap-2"
                  >
                    <Unlink size={18} /> Revoke Node Access
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-stone/60 leading-relaxed font-medium italic">
                    You haven't initialized your node on the blockchain. Connect your wallet to enable smart contract transactions.
                  </p>
                  <Button 
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="w-full h-16 rounded-[1.5rem] bg-forest dark:bg-harvest text-white font-bold tracking-widest gap-3 shadow-2xl transition-all hover:scale-[1.01]"
                  >
                    {isConnecting ? <Loader2 className="animate-spin" /> : <><Wallet size={20} /> Initialize Identity Node</>}
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-card rounded-[2.5rem] border border-border p-8 md:p-12 space-y-8">
              <h3 className="text-[10px] font-bold text-stone/30 tracking-[0.3em] uppercase">Identity Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DetailItem 
                  icon={<Mail size={20}/>} 
                  label="Registered Email" 
                  value={isWalletUser ? "Authorized via Wallet" : user.email} 
                />
                <DetailItem 
                  icon={<MapPin size={20}/>} 
                  label="Distribution Base" 
                  value={profile.location || "Not set"} 
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-card rounded-[2.5rem] border border-border p-8 space-y-6">
              <h4 className="text-[10px] font-bold text-stone/30 tracking-widest uppercase mb-4">Node Operations</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-muted/50 hover:bg-muted transition-all group"
                >
                  <div className="flex items-center gap-4 font-bold text-sm">
                    <Edit2 size={18} className="text-harvest" /> Update Profile
                  </div>
                  <ChevronRight size={16} className="text-stone/20 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={handleRefreshNode}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-muted/50 hover:bg-muted transition-all group"
                >
                  <div className="flex items-center gap-4 font-bold text-sm">
                    <RefreshCcw size={18} className="text-forest dark:text-harvest" /> Sync Node
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] p-8 md:p-10 border border-border shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full text-stone transition-all">
              <X size={20} />
            </button>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight italic">Edit Identity</h2>
                <p className="text-xs text-stone/50 font-medium">Updating node parameters on Harsa network.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone/40 tracking-widest uppercase ml-1">Legal Full Name</label>
                  <input 
                    required 
                    className="w-full p-4 bg-muted/50 rounded-2xl border border-border outline-none font-bold text-sm focus:border-harvest transition-all" 
                    value={editForm.full_name} 
                    onChange={e => setEditForm({...editForm, full_name: e.target.value})} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone/40 tracking-widest uppercase ml-1">Node Location</label>
                  <div className="relative">
                    <input 
                      ref={autocompleteInputRef}
                      required 
                      className="w-full p-4 pl-12 bg-muted/50 rounded-2xl border border-border outline-none font-bold text-sm focus:border-harvest transition-all" 
                      value={editForm.location} 
                      onChange={e => setEditForm({...editForm, location: e.target.value})} 
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-harvest" size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone/40 tracking-widest uppercase ml-1">Node Biography</label>
                  <textarea 
                    className="w-full p-4 bg-muted/50 rounded-2xl border border-border outline-none font-medium h-32 text-sm focus:border-harvest transition-all" 
                    value={editForm.bio} 
                    onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                  />
                </div>

                <Button type="submit" className="w-full bg-forest dark:bg-harvest h-16 rounded-2xl font-bold text-white tracking-widest mt-4 shadow-xl">
                  Verify & Save Node
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-5">
      <div className="p-4 bg-background border border-border rounded-2xl shrink-0">
        <span className="text-harvest">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-stone/40 tracking-widest uppercase mb-1">{label}</p>
        <p className="font-bold text-sm truncate dark:text-white italic">{value}</p>
      </div>
    </div>
  )
}
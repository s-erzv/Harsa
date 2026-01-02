"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext' 
import { User, MapPin, ShieldCheck, Mail, Wallet, Loader2, Link as LinkIcon, RefreshCcw } from 'lucide-react'
import { createWalletClient, custom } from 'viem'
import { polygonAmoy } from 'viem/chains'

export default function ProfilPage() {
  const { user, supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    setLoading(false)
  }

  // FUNGSI SAKTI: Hubungkan ke MetaMask & Simpan ke DB
  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert("Instal MetaMask dulu ya Pak/Bu!")
    
    setIsConnecting(true)
    try {
      const walletClient = createWalletClient({
        chain: polygonAmoy,
        transport: custom(window.ethereum)
      })

      // Minta izin akses akun ke user
      const [address] = await walletClient.requestAddresses()

      // Update alamat wallet ke database Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: address })
        .eq('id', user.id)

      if (error) throw error
      
      alert("Dompet Blockchain Berhasil Terhubung!")
      fetchProfile() // Refresh data UI
    } catch (err) {
      console.error(err)
      alert("Gagal menyambungkan dompet: " + err.message)
    } finally {
      setIsConnecting(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-800" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex font-raleway"> 
      <main className="flex-1 p-5 md:p-12 pb-32">
        <header className="mb-8">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Identitas Petani</h1>
            <p className="text-slate-500 text-sm">Kelola informasi akun dan koneksi blockchain Anda.</p>
        </header>

        <div className="max-w-2xl space-y-6">
          {/* Card Utama */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-center shadow-sm relative overflow-hidden">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-md relative z-10">
              <User size={40} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 relative z-10">{profile?.full_name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 relative z-10">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <ShieldCheck size={12} /> Petani Terverifikasi
              </span>
            </div>
            <ShieldCheck size={150} className="absolute -right-10 -bottom-10 text-emerald-50 opacity-20 rotate-12" />
          </div>

          {/* Card Info Detail */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Informasi Dasar</div>
            <div className="p-8 space-y-8">
              <ProfileItem icon={<Mail className="text-slate-400"/>} label="Alamat Email" value={user.email} />
              <ProfileItem icon={<MapPin className="text-slate-400"/>} label="Lokasi Lahan" value="Jawa Timur, Indonesia" />
              
              {/* Wallet Section */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                <ProfileItem 
                  icon={<Wallet className={profile?.wallet_address ? "text-emerald-800" : "text-slate-300"}/>} 
                  label="ID Blockchain (Amoy)" 
                  value={profile?.wallet_address 
                    ? `${profile.wallet_address.substring(0, 6)}...${profile.wallet_address.substring(38)}` 
                    : "Belum Terkoneksi"} 
                />
                
                <button 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                    ${profile?.wallet_address 
                      ? 'bg-white text-slate-400 border border-slate-200 hover:text-emerald-800' 
                      : 'bg-emerald-800 text-white shadow-lg shadow-emerald-900/20 active:scale-95'}
                  `}
                >
                  {isConnecting ? <RefreshCcw size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                  {profile?.wallet_address ? "Ubah" : "Hubungkan"}
                </button>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-50 transition active:scale-[0.98]">
            Edit Profil Lengkap
          </button>
        </div>
      </main>
    </div>
  )
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-5">
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-50">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 break-all">{value}</p>
      </div>
    </div>
  )
}
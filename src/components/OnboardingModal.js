"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWalletClient } from '@/utils/blockchain'
import { Wallet, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
export default function OnboardingModal() { 
  const { profile, updateWalletAddress, loading: authLoading, user, isInitialLoad } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
 
  if (isInitialLoad || !user) return null
 
  if (authLoading || !profile) return null 
 
  if (profile.wallet_address) return null

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const walletClient = await getWalletClient()
      const [address] = await walletClient.getAddresses()
      await updateWalletAddress(address)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-forest/30 backdrop-blur-md p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-clay/20 p-8 md:p-10 relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="inline-flex p-4 bg-chalk rounded-full border border-clay/20 mb-6 text-harvest animate-bounce">
            <Sparkles size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-forest tracking-tight uppercase italic mb-2">
            Finalize Your Profile
          </h2>
          <p className="text-stone/60 text-sm mb-8 leading-relaxed">
            Selamat datang di Harsa, <b>{profile.full_name}</b>. Hubungkan wallet untuk mulai mengelola hasil tani di blockchain.
          </p>

          <button 
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-forest text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-forest/20 hover:bg-forest/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Connect MetaMask <ArrowRight size={16} /></>}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase italic">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
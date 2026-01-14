"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getWalletClient } from '@/utils/blockchain'
import ThemeToggle from '@/components/ThemeToggle'
import { User, Mail, Lock, Wallet, Loader2, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const { authWithWallet, register, supabase } = useAuth()
  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' })

  const handleWalletAuth = async () => {
    setWalletLoading(true)
    const toastId = toast.loading("Verifying Wallet Identity...")
    try {
      const walletClient = await getWalletClient()
      const [address] = await walletClient.getAddresses()
      
      // await walletClient.signMessage({ account: address, message: "Authorize Harsa Network Access" })

      const result = await authWithWallet(address)
      if (result.success) {
        toast.success("Wallet Authenticated!", { id: toastId })
        router.push('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || "Connection failed", { id: toastId })
    } finally {
      setWalletLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) toast.error(error.message)
  }

  const handleEmailRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(formData.email, formData.password, formData.fullName)
      toast.success("Identity Created! Check email.")
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground flex overflow-hidden font-raleway transition-colors duration-500">
      <div className="hidden lg:flex w-1/2 bg-forest dark:bg-card relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative z-10 text-center space-y-8">
           <div className="p-12 bg-background/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-2xl space-y-6 max-w-sm mx-auto">
               <div className="w-24 h-24 bg-harvest/20 text-harvest rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-harvest/30">
                  <ShieldCheck size={48} />
               </div>
               <h3 className="text-4xl font-bold tracking-tighter italic text-white leading-none">Node Authority.</h3>
               <p className="text-white/40 text-sm font-medium leading-relaxed">
                  Decentralized marketplace for the poetic soul. Secured by smart contracts.
               </p>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-20 bg-background relative overflow-y-auto no-scrollbar">
        <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
          <ThemeToggle />
        </div>

        <div className="max-w-sm w-full mx-auto space-y-10">
          <div className="space-y-3">
             <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-bold text-harvest uppercase tracking-[0.2em] hover:translate-x-1 transition-transform">
               <ArrowLeft size={14} /> Back to Entry
             </Link>
             <h2 className="text-5xl font-bold tracking-tighter italic leading-none">Register</h2>
             <p className="text-stone/50 text-sm font-medium">Join the network via your preferred method.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <Button variant="outline" onClick={handleGoogleAuth} className="h-16 rounded-3xl border-border hover:bg-muted gap-3 font-bold transition-all active:scale-95 shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
             </Button>
             <Button 
                variant="outline" 
                onClick={handleWalletAuth}
                disabled={walletLoading}
                className="h-16 rounded-3xl border-harvest/30 hover:bg-harvest/5 gap-3 font-bold transition-all active:scale-95 shadow-sm"
              >
                {walletLoading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={22} className="text-harvest" />}
                Wallet
             </Button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest bg-background px-4 text-stone/30 italic">
              Or Traditional Route
            </div>
          </div>

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone/40 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/20" size={18} />
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full h-15 pl-12 pr-4 rounded-[1.5rem] bg-card border border-border outline-none focus:ring-4 focus:ring-forest/5 transition-all font-semibold italic shadow-sm"
                  placeholder="Legal name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone/40 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/20" size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full h-15 pl-12 pr-4 rounded-[1.5rem] bg-card border border-border outline-none focus:ring-4 focus:ring-forest/5 transition-all font-semibold shadow-sm"
                  placeholder="Email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone/40 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/20" size={18} />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full h-15 pl-12 pr-4 rounded-[1.5rem] bg-card border border-border outline-none focus:ring-4 focus:ring-forest/5 transition-all font-semibold shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 rounded-[2rem] bg-forest dark:bg-harvest text-white font-bold transition-all shadow-2xl shadow-forest/20 hover:scale-[1.01] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Authorize Node"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
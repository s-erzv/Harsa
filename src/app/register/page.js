"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Mail, KeyRound, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [state, setState] = useState({ loading: false, error: null, success: false })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState({ loading: true, error: null, success: false })
    try {
      await register(form.email, form.password, form.fullName)
      setState({ loading: false, error: null, success: true })
    } catch (err) {
      setState({ loading: false, error: err.message, success: false })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 font-raleway">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group transition-transform hover:scale-105 active:scale-95">
            <div className="flex items-center justify-center gap-3">
               <Image src="/light.png" alt="Logo" width={40} height={40} className="object-contain" />
               <span className="text-2xl font-bold text-forest tracking-tighter">Harsa</span>
            </div>
          </Link>
        </div>

        <div className="bg-white border border-clay/50 p-8 md:p-12 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles size={14} className="text-harvest" />
               <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest leading-none">Join the Node</p>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">Create Account</h2>
            <p className="text-stone/50 text-sm mt-3 font-medium leading-relaxed">
              Start your journey in the global decentralized agricultural network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                <User size={14} className="text-harvest" /> Full Name
              </label>
              <input 
                type="text" 
                required
                placeholder="Enter your name"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none transition-all text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/20"
                onChange={e => setForm({...form, fullName: e.target.value})}
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                <Mail size={14} className="text-harvest" /> Email Address
              </label>
              <input 
                type="email" 
                required
                placeholder="name@example.com"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none transition-all text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/20"
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                <KeyRound size={14} className="text-harvest" /> Password
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-clay/30 outline-none transition-all text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/20"
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>

            <button 
              disabled={state.loading}
              className="w-full bg-forest text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-forest/10 hover:bg-forest/95 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
            >
              {state.loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>Initialize Identity <ArrowRight size={16} className="text-harvest" /></>
              )}
            </button>

            {state.error && (
              <div className="p-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 text-left leading-relaxed">
                <span className="shrink-0">Error:</span> {state.error}
              </div>
            )}

            {state.success && (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 text-left leading-relaxed">
                <ShieldCheck size={16} className="shrink-0" /> Registration successful! Please verify your email to activate your node.
              </div>
            )}

            <div className="text-center text-[12px] text-stone/60 font-semibold pt-4">
              Already a node member?{' '}
              <Link href="/login" className="text-forest font-bold underline decoration-clay underline-offset-4 hover:text-harvest transition-colors">
                Sign In
              </Link>
            </div>
          </form>
        </div>
        
        <p className="mt-12 text-[10px] text-stone/30 text-center font-bold uppercase tracking-[0.4em]">
          Verified Infrastructure &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
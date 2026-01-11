"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, UserPlus, Mail, KeyRound, User, ArrowRight, ShieldCheck } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-raleway">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-chalk rounded-[2rem] border border-clay/20 mb-6 shadow-sm">
            <Image src="/light.png" alt="Logo" width={48} height={48} className="mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-forest tracking-tighter uppercase italic">Global Node Registration</h2>
          <p className="text-stone/60 text-sm mt-2 italic lowercase">Initialize your identity to join the trade network.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border border-clay/30 p-8 md:p-10 rounded-[2.5rem] shadow-sm bg-white/50 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 opacity-[0.03] pointer-events-none">
            <UserPlus size={180} className="rotate-12 text-forest" />
          </div>

          <div className="space-y-1.5 relative z-10 text-left">
            <label className="text-[10px] font-bold text-stone uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <User size={12} className="text-harvest" /> Full name
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. John Doe"
              className="w-full px-5 py-4 rounded-2xl bg-chalk/50 border border-clay outline-none transition-all text-sm text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/30"
              onChange={e => setForm({...form, fullName: e.target.value})}
            />
          </div>

          <div className="space-y-1.5 relative z-10 text-left">
            <label className="text-[10px] font-bold text-stone uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Mail size={12} className="text-harvest" /> Email address
            </label>
            <input 
              type="email" 
              required
              placeholder="vibe@harsa.trade"
              className="w-full px-5 py-4 rounded-2xl bg-chalk/50 border border-clay outline-none transition-all text-sm text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/30"
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="space-y-1.5 relative z-10 text-left">
            <label className="text-[10px] font-bold text-stone uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <KeyRound size={12} className="text-harvest" /> Secure password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl bg-chalk/50 border border-clay outline-none transition-all text-sm text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/30"
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <button 
            disabled={state.loading}
            className="w-full bg-forest text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-forest/20 hover:bg-forest/90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4 uppercase tracking-widest"
          >
            {state.loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>

          {state.error && (
            <div className="p-4 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 text-left">
              <span>Error:</span> {state.error}
            </div>
          )}

          {state.success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 text-left">
              <ShieldCheck size={14} /> Registration successful. Please check your inbox.
            </div>
          )}

          <div className="text-center text-[11px] text-stone font-medium pt-4 tracking-tight italic">
            Already have an account?{' '}
            <Link href="/login" className="text-forest font-bold underline decoration-clay underline-offset-4 hover:text-harvest transition-colors">
              Sign in
            </Link>
          </div>
        </form>
        
        <p className="mt-12 text-[10px] text-stone/40 text-center font-bold uppercase tracking-[0.3em]">
          Powered by Harsa Protocol &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
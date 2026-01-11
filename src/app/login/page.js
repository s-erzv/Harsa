"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, KeyRound, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: null })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState({ loading: true, error: null })
    try {
      await login(form.email, form.password)
    } catch (err) {
      setState({ loading: false, error: err.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-raleway">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-chalk rounded-[2rem] border border-clay/20 mb-6 shadow-sm">
            <Image src="/light.png" alt="Logo" width={48} height={48} className="mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-forest tracking-tighter uppercase italic">Welcome back</h2>
          <p className="text-stone/60 text-sm mt-2 italic lowercase">Authentication required to access the global node.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 border border-clay/30 p-8 md:p-10 rounded-[2.5rem] shadow-sm bg-white/50 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
            <KeyRound size={150} className="rotate-12 text-forest" />
          </div>

          <div className="space-y-1.5 relative z-10 text-left">
            <label className="text-[10px] font-bold text-stone uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Mail size={12} className="text-harvest" /> Email address
            </label>
            <input 
              type="email" 
              required
              placeholder="e.g. vibe@harsa.trade"
              className="w-full px-5 py-4 rounded-2xl bg-chalk/50 border border-clay outline-none transition-all text-sm text-slate-700 focus:ring-4 focus:ring-forest/5 focus:border-forest/30"
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="space-y-1.5 relative z-10 text-left">
            <label className="text-[10px] font-bold text-stone uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <KeyRound size={12} className="text-harvest" /> Password
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
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>

          {state.error && (
            <div className="p-4 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <span>Error:</span> {state.error}
            </div>
          )}

          <div className="text-center text-[11px] text-stone font-medium pt-4 tracking-tight italic">
            Don't have an account?{' '}
            <Link href="/register" className="text-forest font-bold underline decoration-clay underline-offset-4 hover:text-harvest transition-colors">
              Register here
            </Link>
          </div>
        </form>
        
        <p className="mt-12 text-[10px] text-stone/40 text-center font-bold uppercase tracking-[0.3em]">
          Secure Infrastructure &copy; {new Date().getFullYear()} Harsa
        </p>
      </div>
    </div>
  )
}
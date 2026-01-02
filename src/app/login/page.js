"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/light.png" alt="Logo" width={50} height={50} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Selamat Datang Kembali</h2>
          <p className="text-slate-500 text-sm mt-1">Gunakan akun Anda untuk masuk</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 border border-slate-100 p-8 rounded-3xl shadow-sm">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none transition text-slate-800"
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Kata Sandi</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none transition text-slate-800"
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>
          <button 
            disabled={state.loading}
            className="w-full bg-emerald-800 text-white py-4 rounded-xl font-bold hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/10"
          >
            {state.loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
          {state.error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center">{state.error}</div>}
          <div className="text-center text-sm text-slate-500 pt-2">
            Belum memiliki akun? <Link href="/register" className="text-emerald-700 font-bold underline">Daftar Baru</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
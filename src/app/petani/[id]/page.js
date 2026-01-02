"use client"
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ShieldCheck, Star, Package, MapPin, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PetaniProfile() {
  const { id } = useParams()
  const { supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPetaniData = async () => {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single()
      const { data: revs } = await supabase.from('reviews').select('*, buyer:profiles(full_name)').eq('seller_id', id).order('created_at', { ascending: false })
      
      setProfile(prof)
      setReviews(revs || [])
      setLoading(false)
    }
    fetchPetaniData()
  }, [id, supabase])

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-800" /></div>

  return (
    <div className="min-h-screen bg-white font-raleway pb-20">
      <header className="bg-emerald-900 text-white pt-20 pb-32 px-6 rounded-b-[4rem] relative overflow-hidden">
        <div className="absolute top-10 left-10 opacity-10"><ShieldCheck size={300} strokeWidth={0.5} /></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-emerald-200 text-xs font-black uppercase tracking-widest mb-10 hover:text-white transition">
            <ArrowLeft size={14} /> kembali ke pasar
          </Link>
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-emerald-900 text-4xl font-black shadow-2xl shadow-emerald-950/50 border-4 border-emerald-800">
              {profile?.full_name?.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black italic tracking-tighter mb-2">{profile?.full_name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-emerald-800/50 px-4 py-1.5 rounded-full border border-emerald-700">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">skor: {profile?.reputation_score}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                  <MapPin size={12} /> jawa timur, indonesia
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 className="text-xl font-black text-slate-900 italic mb-8">ulasan komunitas</h2>
              <div className="space-y-8">
                {reviews.length > 0 ? reviews.map((r) => (
                  <div key={r.id} className="pb-8 border-b border-slate-50 last:border-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-slate-800 text-sm mb-1">{r.buyer?.full_name}</p>
                        <div className="flex gap-1">
                          {[...Array(r.rating)].map((_, i) => <Star key={i} size={10} className="fill-emerald-800 text-emerald-800" />)}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 italic">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed italic">"{r.comment}"</p>
                  </div>
                )) : <p className="text-center text-slate-300 py-10 italic">belum ada ulasan untuk petani ini</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4">statistik petani</p>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg"><Package size={16} className="text-emerald-800" /></div>
                    <span className="text-xs font-bold text-slate-600">total transaksi</span>
                  </div>
                  <span className="font-black text-emerald-900 text-lg">{reviews.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
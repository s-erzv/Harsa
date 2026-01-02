"use client"
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingCart, Search, Filter, MapPin, ShieldCheck, Plus, Leaf } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => {
    const fetchAllProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    fetchAllProducts()
  }, [supabase])

  return (
    <div className="min-h-screen bg-white font-raleway"> 
      <nav className="fixed w-full bg-white/90 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-emerald-900 uppercase tracking-tighter">harsa pasar</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard/transaksi" className="text-sm font-bold text-slate-600 hover:text-emerald-800 transition">transaksi</Link>
            <div className="relative p-2.5 bg-slate-50 rounded-full cursor-pointer group">
              <ShoppingCart size={20} className="text-emerald-900 group-hover:scale-110 transition" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-800 text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm">0</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-12 bg-emerald-800"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800">rantai pasok terdesentralisasi</p>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-8 leading-tight">hasil bumi <span className="text-emerald-800 italic">terbaik</span> dari petani lokal</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-4.5 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="cari komoditas..." 
                className="w-full pl-14 pr-6 py-4.5 rounded-[2rem] bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-800/10 outline-none transition-all text-sm font-medium"
              />
            </div>
            <button className="flex items-center justify-center gap-3 px-10 py-4.5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-900/10">
              <Filter size={18} /> filter kategori
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-4">
                <div className="aspect-square bg-slate-50 animate-pulse rounded-[3rem]"></div>
                <div className="h-4 w-2/3 bg-slate-50 animate-pulse rounded-full"></div>
                <div className="h-6 w-1/2 bg-slate-50 animate-pulse rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((p) => (
              <Link href={`/marketplace/${p.id}`} key={p.id} className="group">
                <div className="relative aspect-square bg-slate-50 rounded-[3rem] overflow-hidden mb-6 border border-slate-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-emerald-900/10 group-hover:-translate-y-2">
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-emerald-800 shadow-sm border border-emerald-50 tracking-widest">
                      {p.category}
                    </span>
                  </div> 
                  
                  <div className="absolute bottom-6 left-6 z-10">
                    <span className="bg-emerald-800 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      stok: {p.stock_kg} kg
                    </span>
                  </div>

                  <div className="w-full h-full flex items-center justify-center bg-emerald-50/50 text-emerald-100 group-hover:scale-110 transition-transform duration-700">
                    <ShieldCheck size={100} strokeWidth={1} />
                  </div>
                </div>

                <div className="px-2"> 
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-[10px] font-black text-white">
                        {p.profiles?.reputation_score || 100}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">skor reputasi</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <MapPin size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{p.profiles?.full_name || 'petani harsa'}</span>
                  </div>
                  
                  <h3 className="font-black text-slate-800 text-xl mb-2 leading-tight group-hover:text-emerald-800 transition">{p.name}</h3>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">harga per kg</span>
                      <p className="text-emerald-800 font-black text-xl leading-none">rp {p.price_per_kg?.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-800 group-hover:text-white transition-all duration-300 group-hover:rotate-90">
                      <Plus size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
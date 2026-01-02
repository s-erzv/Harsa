"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, ArrowRight, Loader2, Lock, Wallet
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import AddProductModal from '@/components/AddProductModal'

export default function DashboardPage() {
  const { user, supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [marketPrices, setMarketPrices] = useState([])
  const [earnings, setEarnings] = useState({ total_earned: 0, total_locked: 0 })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchData = async () => { 
    if (!user) return
    
    const [profRes, prodRes, earnRes, priceRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('products').select('*').eq('seller_id', user.id).limit(3).order('created_at', { ascending: false }),
      supabase.from('farmer_earnings').select('*').eq('seller_id', user.id).single(),
      supabase.from('market_prices').select('*').order('commodity_name', { ascending: true })
    ])
    
    setProfile(profRes.data)
    setProducts(prodRes.data || [])
    if (earnRes.data) setEarnings(earnRes.data)
    setMarketPrices(priceRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user])

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-white gap-3 font-raleway">
      <Loader2 className="animate-spin text-emerald-800" size={32} />
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">sinkronisasi harga pasar...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-5 md:p-10 space-y-8 pb-32 font-raleway">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter italic uppercase">
            halo, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">pusat kendali hasil bumi</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-emerald-800 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-900 transition-all active:scale-95"
          >
            <Plus size={18} /> tambah panen
          </button>
          <NotificationBell />
        </div>
      </header>
 
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900">
        <div className="lg:col-span-1 bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl group">
          <div className="relative z-10">
            <p className="text-emerald-100/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">saldo cair (polygon)</p>
            <h2 className="text-3xl font-black tracking-tight italic">Rp {earnings.total_earned?.toLocaleString()}</h2>
          </div>
          <div className="mt-8 flex items-center gap-2 bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm relative z-10">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-widest">blockchain verified</span>
          </div>
          <Wallet size={160} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 group-hover:scale-110 transition-all duration-700" />
        </div>
 
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">dana tertahan (escrow)</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Rp {earnings.total_locked?.toLocaleString()}</h2>
          </div>
          <div className="mt-8 flex items-center gap-2 bg-orange-50 w-fit px-4 py-1.5 rounded-full border border-orange-100 relative z-10">
            <Lock size={12} className="text-orange-600" />
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">proses logistik</span>
          </div>
          <TrendingUp size={160} className="absolute -right-8 -bottom-8 text-slate-50 rotate-12 group-hover:scale-110 transition-all duration-700" />
        </div>
 
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">indeks pasar riil</h3>
            <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">LIVE</span>
          </div>
          <div className="space-y-4">
            {marketPrices.map((h) => (
              <div key={h.id} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0">
                <span className="text-[11px] font-black text-slate-600 uppercase italic tracking-tighter">{h.commodity_name}</span>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800 tracking-tighter">Rp {h.current_price?.toLocaleString()}</p>
                  <p className={`text-[9px] font-black flex items-center justify-end gap-1 ${h.change_percentage >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {h.change_percentage >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {Math.abs(h.change_percentage)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm italic tracking-tighter flex items-center gap-3 uppercase">
            <Package size={20} className="text-emerald-800" /> inventaris panen
          </h3>
          <ArrowRight size={18} className="text-slate-300" />
        </div>
        <div className="p-4">
          {products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold italic uppercase tracking-widest text-slate-900">belum ada komoditas terdaftar.</div>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition rounded-[2rem] text-slate-900">
                  <div>
                    <p className="font-black text-slate-800 text-sm tracking-tighter italic">{p.name}</p>
                    <p className="text-[9px] text-emerald-700 font-black uppercase tracking-widest">{p.category}</p>
                  </div>
                  <p className="text-sm font-black text-slate-500 tracking-tighter">{p.stock_kg} kg</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 rounded-[3rem] p-10 border border-emerald-100 flex flex-col justify-center relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-xl font-black text-emerald-900 mb-3 italic tracking-tighter uppercase">transparansi total</h3>
          <p className="text-emerald-800/60 text-xs leading-relaxed max-w-sm font-medium italic text-justify">
            data harga pasar di atas diambil langsung dari sistem informasi harga pangan nasional. gunakan sebagai acuan untuk menentukan harga jual yang kompetitif.
          </p>
        </div>
        <Package size={200} className="absolute -right-12 -bottom-12 text-emerald-900/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
      </div>

      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        supabase={supabase} 
        onSuccess={fetchData} 
      />
    </div>
  )
}
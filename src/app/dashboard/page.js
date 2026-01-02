"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, ArrowRight, Loader2, Lock, Wallet, Info, MapPin
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import NotificationBell from '@/components/NotificationBell'
import ProductModal from '@/components/ProductModal'

export default function DashboardPage() {
  const { user, supabase } = useAuth()
  const [data, setData] = useState({ profile: null, products: [], prices: [], earnings: { total_earned: 0, total_locked: 0 } })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('Jawa Barat')
  const [greeting, setGreeting] = useState('Selamat Datang')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 11) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 19) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')
  }, [])

  const fetchData = async () => {
    if (!user) return
    try {
      const [prof, prod, earn, price] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*').eq('seller_id', user.id).limit(3).order('created_at', { ascending: false }),
        supabase.from('farmer_earnings').select('*').eq('seller_id', user.id).single(),
        supabase.from('market_prices').select('*').order('commodity_name', { ascending: true })
      ])
      setData({ 
        profile: prof.data, 
        products: prod.data || [], 
        earnings: earn.data || { total_earned: 0, total_locked: 0 }, 
        prices: price.data || [] 
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [user])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-forest text-chalk px-3 py-2 rounded-xl text-[10px] font-bold shadow-2xl border border-clay/20">
          <p className="mb-1 text-clay/60">{payload[0].payload.d}</p>
          <p className="text-white">Rp {payload[0].value.toLocaleString('id-ID')}</p>
        </div>
      )
    }
    return null
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 font-raleway">
      <Loader2 className="animate-spin text-forest" size={32} />
      <p className="text-stone/40 text-[10px] font-bold uppercase tracking-widest">Sinkronisasi Data...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-10 space-y-10 pb-32 font-raleway  min-h-screen"> 
      <header className="flex justify-between items-center sticky top-0 z-20 py-4 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-forest tracking-tight leading-none">
            {greeting}, {data.profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-stone/60 font-medium mt-1">Pantau aktivitas hasil bumi Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-3 bg-forest text-chalk rounded-2xl shadow-lg shadow-forest/20 active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>
 
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-forest rounded-[2.5rem] p-8 text-chalk relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-xl shadow-forest/10">
          <div className="relative z-10">
            <p className="text-clay/60 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo Tersedia</p>
            <h2 className="text-4xl font-bold tracking-tight">Rp {data.earnings.total_earned?.toLocaleString('id-ID')}</h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/5 backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[9px] font-bold uppercase">Blockchain Verified</span>
          </div>
          <Wallet size={160} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 pointer-events-none" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-clay flex flex-col justify-between min-h-[220px] relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <p className="text-stone/40 text-[10px] font-bold uppercase tracking-widest mb-1">Dana Dalam Escrow</p>
            <h2 className="text-4xl font-bold text-forest tracking-tight">Rp {data.earnings.total_locked?.toLocaleString('id-ID')}</h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-clay/30 w-fit px-3 py-1 rounded-full border border-clay">
            <Lock size={14} className="text-harvest" />
            <span className="text-[9px] font-bold text-harvest uppercase">Proses Logistik</span>
          </div>
          <TrendingUp size={160} className="absolute -right-8 -bottom-8 text-clay/20 rotate-12 pointer-events-none" />
        </div>
      </section>
 
      <section className="space-y-6">
        <div className="flex flex-col gap-4 px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-forest flex items-center gap-2 tracking-tight">
              <TrendingUp size={18} className="text-harvest" /> Indeks Pasar {selectedRegion}
            </h3>
            <span className="text-[10px] font-bold text-forest bg-clay px-2 py-1 rounded-full animate-pulse">LIVE</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {['Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Sumatera'].map(reg => (
              <button 
                key={reg} 
                onClick={() => setSelectedRegion(reg)}
                className={`px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedRegion === reg 
                  ? 'bg-forest text-chalk border-forest shadow-md' 
                  : 'bg-white text-stone/40 border-clay hover:border-forest/30'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.prices.map((h) => (
            <div key={h.id} className="bg-white p-6 rounded-[2.5rem] border border-clay shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-sm font-bold text-forest uppercase tracking-tight italic">{h.commodity_name}</h4>
                  <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${h.change_percentage >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {h.change_percentage >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                    {h.change_percentage >= 0 ? '+' : ''}{h.change_percentage}%
                  </p>
                </div>
                <p className="text-sm font-bold text-forest font-mono">Rp {h.current_price?.toLocaleString('id-ID')}</p>
              </div>
              
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={h.price_history}>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#FAEDCD', strokeWidth: 2 }} />
                    <Line 
                      type="monotone" 
                      dataKey="p" 
                      stroke={h.change_percentage >= 0 ? "#1B4332" : "#ef4444"} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: h.change_percentage >= 0 ? "#1B4332" : "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </section> 
      <div className="bg-clay/20 p-8 rounded-[2.5rem] border border-clay flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-white rounded-2xl text-harvest shadow-sm"><Info size={24} /></div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-xs text-stone/60 leading-relaxed font-medium">
            <strong>Catatan Prototype:</strong> Seluruh data di atas adalah simulasi internal Harsa. Sistem ini dipersiapkan untuk sinkronisasi data riil dari <strong>Badan Pangan Nasional</strong> pada tahap produksi selanjutnya.
          </p>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        supabase={supabase} 
        onSuccess={fetchData} 
      />
    </div>
  )
}
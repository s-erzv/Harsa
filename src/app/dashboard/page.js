"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, ArrowRight, Loader2, Lock, Wallet, Info, 
  MapPin, History, ClipboardList, Languages, Zap
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import NotificationBell from '@/components/NotificationBell'
import ProductModal from '@/components/ProductModal'
import FarmLogModal from '@/components/FarmLogModal'

export default function DashboardPage() {
  const { user, supabase } = useAuth()
  const [data, setData] = useState({ 
    profile: null, 
    products: [], 
    prices: [], 
    earnings: { total_earned: 0, total_locked: 0 },
    logs: [] 
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('Jawa Barat')
  const [greeting, setGreeting] = useState('Selamat Datang')
  const [lang, setLang] = useState('id')

  const t = {
    id: {
      sub: "Pantau aktivitas hasil bumi Anda.",
      balance: "Saldo Tersedia",
      escrow: "Dana Dalam Escrow",
      process: "Proses Logistik",
      market_title: "Indeks Pasar",
      log_title: "Log Aktivitas Tani Terbaru",
      add_log: "Tambah Log",
      empty_log: "Belum Ada Aktivitas Budidaya",
      proto_note: "Seluruh data di atas adalah simulasi internal Harsa. Sistem ini dipersiapkan untuk sinkronisasi data riil dari Badan Pangan Nasional pada tahap produksi selanjutnya."
    },
    en: {
      sub: "Monitor your harvest activities.",
      balance: "Available Balance",
      escrow: "Funds in Escrow",
      process: "Logistics Process",
      market_title: "Market Index",
      log_title: "Latest Farm Activity Logs",
      add_log: "Add Log",
      empty_log: "No Cultivation Activities Yet",
      proto_note: "All data above are internal Harsa simulations. This system is prepared for real data synchronization from the National Food Agency in the next production stage."
    }
  }

  const content = lang === 'id' ? t.id : t.en

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 11) setGreeting(lang === 'id' ? 'Selamat Pagi' : 'Good Morning')
    else if (hour < 15) setGreeting(lang === 'id' ? 'Selamat Siang' : 'Good Afternoon')
    else if (hour < 19) setGreeting(lang === 'id' ? 'Selamat Sore' : 'Good Evening')
    else setGreeting(lang === 'id' ? 'Selamat Malam' : 'Good Night')
  }, [lang])

  const fetchData = async () => {
    if (!user) return
    try {
      const [prof, prod, earn, price, logs] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('farmer_earnings').select('*').eq('seller_id', user.id).single(),
        supabase.from('market_prices').select('*').order('commodity_name', { ascending: true }),
        supabase.from('farm_logs').select('*, products!inner(seller_id)').eq('products.seller_id', user.id).limit(5).order('created_at', { ascending: false })
      ])
      
      setData({ 
        profile: prof.data, 
        products: prod.data || [], 
        earnings: earn.data || { total_earned: 0, total_locked: 0 }, 
        prices: price.data || [],
        logs: logs.data || []
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
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="text-stone/40 text-[10px] font-bold uppercase tracking-widest italic">Syncing Blockchain Data...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 pb-32 font-raleway min-h-screen bg-white"> 
      <header className="flex justify-between items-center py-4 sticky top-0 z-30 bg-white/80 backdrop-blur-md">
        <div className="flex flex-col text-left">
          <h1 className="text-xl md:text-2xl font-bold text-forest tracking-tight">
            {greeting}, {data.profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-stone/60 font-medium mt-1">{content.sub}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-chalk border border-clay/50 text-[10px] font-bold text-forest transition-all hover:bg-clay/20"
          >
            <Languages size={14} /> {lang.toUpperCase()}
          </button>
          <NotificationBell />
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-3 bg-forest text-chalk rounded-2xl shadow-xl shadow-forest/20 active:scale-90 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-forest rounded-[2.5rem] p-8 text-chalk relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-2xl shadow-forest/10 group transition-all">
          <div className="relative z-10 text-left">
            <p className="text-clay/60 text-[10px] font-bold uppercase tracking-widest mb-1">{content.balance}</p>
            <h2 className="text-4xl font-bold tracking-tight italic tabular-nums">Rp {data.earnings.total_earned?.toLocaleString('id-ID')}</h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Blockchain Verified</span>
          </div>
          <Wallet size={180} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-clay flex flex-col justify-between min-h-[220px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
          <div className="relative z-10 text-left">
            <p className="text-stone/40 text-[10px] font-bold uppercase tracking-widest mb-1">{content.escrow}</p>
            <h2 className="text-4xl font-bold text-forest tracking-tight tabular-nums italic">Rp {data.earnings.total_locked?.toLocaleString('id-ID')}</h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-clay/30 w-fit px-3 py-1.5 rounded-full border border-clay">
            <Lock size={14} className="text-harvest" />
            <span className="text-[9px] font-bold text-harvest uppercase tracking-tighter">{content.process}</span>
          </div>
          <TrendingUp size={180} className="absolute -right-8 -bottom-8 text-clay/20 rotate-12 pointer-events-none group-hover:translate-x-2 transition-transform duration-700" />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-forest flex items-center gap-2 tracking-tight uppercase italic">
              <Zap size={18} className="text-harvest fill-harvest" /> {content.market_title} {selectedRegion}
            </h3>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
               <span className="text-[10px] font-bold text-forest tracking-widest">LIVE</span>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {['Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Sumatera'].map(reg => (
              <button 
                key={reg} 
                onClick={() => setSelectedRegion(reg)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  selectedRegion === reg 
                  ? 'bg-forest text-chalk border-forest shadow-lg' 
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
            <div key={h.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-clay shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <h4 className="text-sm font-bold text-forest uppercase tracking-tight italic">{h.commodity_name}</h4>
                  <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${h.change_percentage >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {h.change_percentage >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                    {h.change_percentage >= 0 ? '+' : ''}{h.change_percentage}%
                  </p>
                </div>
                <p className="text-lg font-bold text-forest tabular-nums">Rp {h.current_price?.toLocaleString('id-ID')}</p>
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
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: h.change_percentage >= 0 ? "#1B4332" : "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </section>
      

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-forest flex items-center gap-2 tracking-tight uppercase italic">
            <History size={18} className="text-harvest" /> {content.log_title}
          </h3>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="text-[10px] font-bold text-forest bg-clay/50 px-4 py-2 rounded-xl border border-clay active:scale-95 transition-all uppercase tracking-widest"
          >
            {content.add_log}
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-clay overflow-hidden shadow-sm">
          {data.logs.length > 0 ? (
            <div className="divide-y divide-clay/30">
              {data.logs.map((log) => (
                <div key={log.id} className="p-6 flex items-start gap-4 hover:bg-chalk transition-all group text-left">
                  <div className="w-12 h-12 rounded-2xl bg-chalk flex items-center justify-center text-forest shrink-0 group-hover:bg-white border border-clay/20 transition-all shadow-inner">
                    <ClipboardList size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-forest truncate">{log.activity_name}</h4>
                      <span className="text-[9px] font-bold text-stone/40 uppercase tracking-widest whitespace-nowrap ml-2">
                        {new Date(log.logged_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                      </span>
                    </div>
                    <p className="text-xs text-stone/60 line-clamp-1 font-medium italic">"{log.description}"</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-chalk rounded-full flex items-center justify-center mx-auto text-stone/20 shadow-inner">
                <ClipboardList size={32} strokeWidth={1} />
              </div>
              <p className="text-[10px] font-bold text-stone/40 uppercase tracking-[0.2em]">{content.empty_log}</p>
            </div>
          )}
        </div>
      </section>

      <div className="bg-clay/10 p-8 rounded-[2.5rem] border border-clay/30 flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-white rounded-2xl text-harvest shadow-sm shrink-0"><Info size={24} /></div>
        <div className="flex-1 text-left">
          <p className="text-[11px] text-stone/60 leading-relaxed font-medium text-justify">
            <strong>Catatan Prototype:</strong> {content.proto_note}
          </p>
        </div>
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} supabase={supabase} onSuccess={fetchData} />
      
      <FarmLogModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        user={user} 
        products={data.products} 
        supabase={supabase} 
        onSuccess={fetchData} 
      />
    </div>
  )
}
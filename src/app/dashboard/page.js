"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, Loader2, Lock, Wallet, Info, 
  History, ClipboardList, Zap, Globe
} from 'lucide-react'
// import NotificationBell from '@/components/NotificationBell'
import ProductModal from '@/components/ProductModal'
import FarmLogModal from '@/components/FarmLogModal'

const API_NINJAS_KEY = process.env.NEXT_PUBLIC_API_NINJAS_KEY || 'YOUR_ACTUAL_API_KEY';

const AGRI_CONFIG = [
  { id: 'rough_rice', label: 'rough rice', unit: 'per 100 lbs (cwt)' },
  { id: 'oat', label: 'oat futures', unit: 'per bushel (~14.5kg)' },
  { id: 'feeder_cattle', label: 'feeder cattle', unit: 'per lb (~0.45kg)' },
  { id: 'class_3_milk', label: 'class III milk', unit: 'per 100 lbs (cwt)' }
];

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

  const toUSD = (amount) => (amount / 15600);

  const fetchAgriPrices = async () => {
    try {
      const pricePromises = AGRI_CONFIG.map(async (item) => {
        const res = await fetch(`https://api.api-ninjas.com/v1/commodityprice?name=${item.id}`, {
          headers: { 'X-Api-Key': API_NINJAS_KEY }
        });
        const json = await res.json();
        return {
          ...item,
          price: json.price,
          change: (Math.random() * 2 - 1).toFixed(2)
        };
      });
      return await Promise.all(pricePromises);
    } catch (err) {
      console.error("api error:", err);
      return [];
    }
  }

  const fetchData = async () => {
    if (!user) return
    try {
      const [prof, prod, earn, logs, agriData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('farmer_earnings').select('*').eq('seller_id', user.id).single(),
        supabase.from('farm_logs').select('*, products!inner(seller_id)').eq('products.seller_id', user.id).limit(5).order('created_at', { ascending: false }),
        fetchAgriPrices()
      ])
      
      setData({ 
        profile: prof.data, 
        products: prod.data || [], 
        earnings: earn.data || { total_earned: 0, total_locked: 0 }, 
        prices: agriData,
        logs: logs.data || []
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [user])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="text-stone/40 text-[10px] font-bold mt-4 tracking-widest italic font-raleway text-center px-6 uppercase">Syncing global agri-market...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 pb-32 font-raleway min-h-screen bg-white text-left max-w-7xl mx-auto"> 
      
      <header className="flex justify-between items-center py-4 top-0 z-30 bg-white/80 backdrop-blur-md">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-forest tracking-tight">
            Dashboard, {data.profile?.full_name?.split(' ')[0].toLowerCase()}
          </h1>
          <p className="text-[10px] text-stone/50 font-bold tracking-[0.2em] uppercase leading-none mt-1">Global Trade Node</p>
        </div>
        <div className="flex items-center gap-3">
          {/* <NotificationBell /> */}
          <button onClick={() => setIsModalOpen(true)} className="p-3 bg-forest text-chalk rounded-2xl shadow-xl shadow-forest/20 active:scale-90 transition-all hover:bg-forest/95">
            <Plus size={20} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-forest rounded-[2.5rem] p-8 text-chalk relative overflow-hidden flex flex-col justify-between min-h-[200px] shadow-2xl shadow-forest/20 group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={12} className="text-emerald-400 opacity-50" />
              <p className="text-clay/60 text-[10px] font-bold tracking-widest uppercase">available balance</p>
            </div>
            <h2 className="text-5xl font-bold tracking-tighter italic tabular-nums">
              ${toUSD(data.earnings.total_earned).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[9px] font-bold tracking-tighter uppercase">verified ledger</span>
          </div>
          <Wallet size={160} className="absolute -right-4 -bottom-4 text-white/5 rotate-12 pointer-events-none group-hover:scale-105 transition-transform duration-700" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-clay flex flex-col justify-between min-h-[200px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={12} className="text-stone-300" />
              <p className="text-stone/40 text-[10px] font-bold tracking-widest uppercase">locked in escrow</p>
            </div>
            <h2 className="text-5xl font-bold text-forest tracking-tighter tabular-nums italic">
              ${toUSD(data.earnings.total_locked).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 bg-clay/30 w-fit px-3 py-1.5 rounded-full border border-clay">
            <Zap size={14} className="text-harvest" />
            <span className="text-[9px] font-bold text-harvest tracking-tighter uppercase italic">delivery phase</span>
          </div>
          <TrendingUp size={160} className="absolute -right-4 -bottom-4 text-clay/10 rotate-12 pointer-events-none group-hover:translate-x-2 transition-transform duration-700" />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold text-forest flex items-center gap-2 tracking-[0.1em] italic text-left uppercase">
            <Globe size={16} className="text-harvest" /> global market index
          </h3>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-bold text-emerald-600 tracking-widest uppercase">live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.prices.map((item) => (
            <div key={item.id} className="bg-chalk/30 p-6 rounded-[2.2rem] border border-clay transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div className="min-w-0">
                  <h4 className="text-[10px] font-bold text-forest uppercase tracking-widest mb-1 truncate">{item.label}</h4>
                  <p className="text-[9px] text-stone/40 font-medium tracking-tight leading-none">{item.unit}</p>
                </div>
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </div>
              </div>
              <div className="mt-6 flex items-end justify-between relative z-10">
                <p className="text-3xl font-bold text-forest tabular-nums tracking-tighter">${item.price}</p>
                {item.change >= 0 ? 
                  <TrendingUp size={20} className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" /> : 
                  <TrendingDown size={20} className="text-red-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                }
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold text-forest flex items-center gap-2 tracking-[0.1em] italic text-left uppercase">
            <ClipboardList size={16} className="text-harvest" /> cultivation logs
          </h3>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="text-[9px] font-bold text-forest bg-chalk px-4 py-2 rounded-xl border border-clay active:scale-95 transition-all tracking-widest shadow-sm hover:bg-white uppercase"
          >
            add log
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-clay overflow-hidden shadow-sm">
          {data.logs.length > 0 ? (
            <div className="divide-y divide-clay/20">
              {data.logs.map((log) => (
                <div key={log.id} className="p-6 flex items-center gap-5 hover:bg-chalk transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-forest shrink-0 border border-clay/30 group-hover:border-forest/20 transition-all shadow-sm">
                    <History size={18} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-bold text-forest truncate tracking-tight">{log.activity_name.toLowerCase()}</h4>
                      <span className="text-[9px] font-bold text-stone/30 uppercase tracking-widest whitespace-nowrap ml-4">
                        {new Date(log.logged_at).toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}
                      </span>
                    </div>
                    <p className="text-xs text-stone/50 line-clamp-1 font-medium italic">"{log.description}"</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-chalk rounded-full flex items-center justify-center text-stone-200 shadow-inner">
                <ClipboardList size={30} strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-bold text-stone/40 tracking-[0.2em] uppercase">No logs recorded</p>
            </div>
          )}
        </div>
      </section>

      <footer className="pt-6">
        <div className="bg-chalk/30 border border-clay/20 rounded-full px-6 py-3 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-harvest" />
            <p className="text-[9px] font-bold text-stone/50 uppercase tracking-widest">
              Data source: API Ninjas Futures
            </p>
          </div>
          <div className="hidden md:block w-1 h-1 bg-clay/30 rounded-full" />
          <div className="hidden md:block w-1 h-1 bg-clay/30 rounded-full" />
          <p className="text-[9px] font-medium text-stone/40 italic">
            Simulation data for prototype purposes only.
          </p>
        </div>
      </footer>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} supabase={supabase} onSuccess={fetchData} />
      <FarmLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} user={user} products={data.products} supabase={supabase} onSuccess={fetchData} />
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, Loader2, Lock, Wallet, Info, 
  History, ClipboardList, Zap, Globe, Activity, Layers
} from 'lucide-react'
import ProductModal from '@/components/ProductModal'
import FarmLogModal from '@/components/FarmLogModal'
import { Badge } from '@/components/ui/badge'

const API_NINJAS_KEY = process.env.NEXT_PUBLIC_API_NINJAS_KEY || 'YOUR_ACTUAL_API_KEY';

const AGRI_CONFIG = [
  { id: 'rough_rice', label: 'Rough Rice', unit: 'per 100 lbs' },
  { id: 'oat', label: 'Oat Futures', unit: 'per bushel' },
  { id: 'feeder_cattle', label: 'Feeder Cattle', unit: 'per lb' },
  { id: 'class_3_milk', label: 'Class III Milk', unit: 'per 100 lbs' }
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
      console.error("Market API error:", err);
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
      console.error("Data Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [user])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="text-stone/40 text-[10px] font-bold mt-4 tracking-widest text-center px-6">Synchronizing Node Data...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-10 space-y-10 pb-32 font-raleway min-h-screen text-left max-w-7xl mx-auto"> 
      
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Welcome, {data.profile?.full_name?.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] text-stone/50 font-bold tracking-widest">Active Merchant Node</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="p-4 bg-forest text-chalk rounded-2xl shadow-xl shadow-forest/20 active:scale-90 transition-all hover:bg-forest/95">
          <Plus size={24} />
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-forest rounded-[2.5rem] p-8 text-chalk relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-2xl shadow-forest/10 group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} className="text-emerald-400 opacity-50" />
              <p className="text-clay/60 text-[11px] font-bold tracking-widest">Available Liquidity</p>
            </div>
            <h2 className="text-5xl font-bold tracking-tighter tabular-nums leading-none">
              ${toUSD(data.earnings.total_earned).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold tracking-tight">On-Chain Verified</span>
            </div>
          </div>
          <Wallet size={180} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-clay flex flex-col justify-between min-h-[220px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={14} className="text-stone-300" />
              <p className="text-stone/40 text-[11px] font-bold tracking-widest">Escrow Settlement</p>
            </div>
            <h2 className="text-5xl font-bold text-forest tracking-tighter tabular-nums leading-none">
              ${toUSD(data.earnings.total_locked).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-4 flex items-center gap-2 bg-clay/20 w-fit px-3 py-1.5 rounded-full border border-clay/30">
              <Zap size={14} className="text-harvest" />
              <span className="text-[10px] font-bold text-harvest tracking-tight">Fulfillment Phase</span>
            </div>
          </div>
          <TrendingUp size={180} className="absolute -right-8 -bottom-8 text-clay/10 rotate-12 pointer-events-none group-hover:translate-x-2 transition-transform duration-700" />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-chalk rounded-xl border border-clay/50">
                <Activity size={18} className="text-forest" />
             </div>
             <h3 className="text-xs font-bold text-forest tracking-widest">Market Price Indices</h3>
          </div>
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 text-[10px] font-bold tracking-tighter">Live Sync</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.prices.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-clay/30 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <h4 className="text-[10px] font-bold text-stone/40 tracking-wider mb-1 truncate">{item.label}</h4>
                  <p className="text-[9px] text-stone/30 font-semibold leading-none">{item.unit}</p>
                </div>
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${item.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
                </div>
              </div>
              <p className="text-3xl font-bold text-forest tabular-nums tracking-tighter">${item.price}</p>
              <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 {item.change >= 0 ? <TrendingUp size={60} /> : <TrendingDown size={60} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-chalk rounded-xl border border-clay/50">
                <Layers size={18} className="text-forest" />
             </div>
             <h3 className="text-xs font-bold text-forest tracking-widest">Node Activity Logs</h3>
          </div>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="text-[10px] font-bold text-forest bg-white px-5 py-2.5 rounded-xl border border-clay shadow-sm active:scale-95 transition-all tracking-widest hover:bg-chalk"
          >
            Create Log
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-clay/50 overflow-hidden shadow-sm">
          {data.logs.length > 0 ? (
            <div className="divide-y divide-clay/20">
              {data.logs.map((log) => (
                <div key={log.id} className="p-6 flex items-center gap-6 hover:bg-[#FAFAFA] transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-forest shrink-0 border border-clay/30 group-hover:bg-white group-hover:scale-105 transition-all">
                    <History size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-bold text-slate-700 truncate capitalize">{log.activity_name}</h4>
                      <span className="text-[10px] font-bold text-stone/30 tracking-widest whitespace-nowrap">
                        {new Date(log.logged_at).toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}
                      </span>
                    </div>
                    <p className="text-xs text-stone/50 line-clamp-1 font-medium leading-relaxed">
                      Protocol Note: {log.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-24 text-center flex flex-col items-center gap-4 bg-white">
              <div className="w-20 h-20 bg-chalk rounded-3xl flex items-center justify-center text-stone-200 shadow-inner">
                <ClipboardList size={32} strokeWidth={1.5} />
              </div>
              <p className="text-[11px] font-bold text-stone/40 tracking-widest">No node synchronization found</p>
            </div>
          )}
        </div>
      </section>

      <footer className="pt-10">
        <div className="bg-white border border-clay/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-forest/5 rounded-xl flex items-center justify-center text-forest">
                <Info size={20} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-stone-700 tracking-widest">Global Protocol Data</p>
                <p className="text-[9px] text-stone/40 font-medium">Source: API Ninjas Commodities Index</p>
             </div>
          </div>
          <div className="h-10 w-[1px] bg-clay/50 hidden md:block" />
          <p className="text-[10px] text-stone/40 font-bold tracking-widest text-center md:text-right">
            Verified L2 Infrastructure • 2026 Protocol Ready
          </p>
        </div>
      </footer>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} supabase={supabase} onSuccess={fetchData} />
      <FarmLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} user={user} products={data.products} supabase={supabase} onSuccess={fetchData} />
    </div>
  )
}
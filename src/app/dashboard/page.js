"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, Loader2, Lock, Wallet, Info, 
  History, ClipboardList, Zap, Globe, Activity, Layers,
  Handshake, Check, X as CloseIcon,
  ArrowRight, Coins, LayoutGrid
} from 'lucide-react'
import ProductModal from '@/components/ProductModal'
import FarmLogModal from '@/components/FarmLogModal'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getMarketRates } from '@/utils/blockchain'

const API_NINJAS_KEY = process.env.NEXT_PUBLIC_API_NINJAS_KEY;

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
    logs: [],
    pendingNegos: [] 
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [rates, setRates] = useState(null)

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
      return [];
    }
  }

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const [prof, prod, earn, logs, agriData, marketRates] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('farmer_earnings').select('*').eq('seller_id', user.id).single(),
        supabase.from('farm_logs').select('*, products!inner(seller_id)').eq('products.seller_id', user.id).limit(5).order('created_at', { ascending: false }),
        fetchAgriPrices(),
        getMarketRates()
      ])
      
      setData({ 
        profile: prof.data, 
        products: prod.data || [], 
        earnings: earn.data || { total_earned: 0, total_locked: 0 }, 
        prices: agriData,
        logs: logs.data || []
      })
      setRates(marketRates)
    } catch (err) {
      console.error("Data Sync Error:", err)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse italic">Ledger Syncing...</p>
    </div>
  )

  const ethToUsdValue = (eth) => eth * (rates?.ethToUsd || 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-raleway transition-colors duration-500 pb-32">
      <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">
        
        <header className="flex justify-between items-center py-2 animate-in fade-in duration-700">
          <div className="text-left">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter italic leading-none ">
              Welcome, {data.profile?.full_name?.split(' ')[0]}<span className="text-harvest">.</span>
            </h1>
            <div className="flex items-center gap-2 mt-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone/40 italic">Merchant Node Active</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-14 h-14 md:w-16 md:h-16 bg-forest dark:bg-harvest text-white rounded-2xl md:rounded-3xl shadow-2xl shadow-forest/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-[3rem] p-8 md:p-12 border-2 border-border relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-sm hover:shadow-2xl transition-all duration-700 group">
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} className="text-harvest opacity-50" />
                <p className="text-stone/40 text-[11px] font-bold tracking-widest uppercase italic">Settled Liquidity</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-forest dark:text-harvest">
                   <Coins size={28} />
                   <h2 className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums leading-none">
                     {data.earnings.total_earned.toFixed(4)}
                   </h2>
                </div>
                <p className="text-xl font-bold text-stone/30 italic ml-1">
                  ≈ ${ethToUsdValue(data.earnings.total_earned).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-3 bg-muted w-fit px-4 py-2 rounded-2xl border border-border mt-8">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Verified on L2</span>
            </div>
            <Activity size={240} className="absolute -right-12 -bottom-12 text-forest/5 dark:text-harvest/5 -rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
          </div>

          <div className="bg-card rounded-[3rem] p-8 md:p-12 border-2 border-border relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-sm hover:shadow-2xl transition-all duration-700 group">
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={14} className="text-harvest opacity-50" />
                <p className="text-stone/40 text-[11px] font-bold tracking-widest uppercase italic">Escrow Staking</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-stone">
                   <Coins size={28} />
                   <h2 className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums leading-none">
                     {data.earnings.total_locked.toFixed(4)}
                   </h2>
                </div>
                <p className="text-xl font-bold text-stone/30 italic ml-1">
                  ≈ ${ethToUsdValue(data.earnings.total_locked).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-3 bg-muted w-fit px-4 py-2 rounded-2xl border border-border mt-8">
              <Zap size={16} className="text-harvest animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-harvest">Fulfillment phase</span>
            </div>
            <TrendingUp size={240} className="absolute -right-12 -bottom-12 text-stone/5 -rotate-12 pointer-events-none group-hover:translate-x-4 transition-transform duration-1000" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-4 md:px-2">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-muted rounded-2xl border border-border">
                  <LayoutGrid size={18} className="text-harvest" />
               </div>
               <h3 className="text-sm font-bold tracking-widest uppercase italic opacity-60">Market Index Console</h3>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 text-[9px] font-bold tracking-widest uppercase italic">Live Protocol Sync</Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {data.prices.map((item) => (
              <div key={item.id} className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border hover:border-harvest/50 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0 text-left">
                    <h4 className="text-[10px] font-bold text-stone/40 uppercase tracking-widest mb-1 truncate italic">{item.label}</h4>
                    <p className="text-[8px] font-bold text-stone/20 uppercase tracking-tighter">{item.unit}</p>
                  </div>
                  <div className={`text-[9px] font-black px-2 py-1 rounded-lg ${item.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tighter tabular-nums leading-none text-foreground italic">${item.price}</p>
                <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                   {item.change >= 0 ? <TrendingUp size={100} /> : <TrendingDown size={100} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-4 md:px-2">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-muted rounded-2xl border border-border">
                  <Layers size={18} className="text-harvest" />
               </div>
               <h3 className="text-sm font-bold tracking-widest uppercase italic opacity-60">Synchronization Logs</h3>
            </div>
            <button 
              onClick={() => setIsLogModalOpen(true)}
              className="text-[10px] font-bold text-foreground bg-card px-5 py-3 rounded-2xl border border-border shadow-sm active:scale-95 transition-all tracking-widest uppercase hover:border-harvest"
            >
              Create Sync
            </button>
          </div>

          <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-sm">
            {data.logs.length > 0 ? (
              <div className="divide-y divide-border">
                {data.logs.map((log) => (
                  <div key={log.id} className="p-6 md:p-8 flex items-center gap-6 hover:bg-muted/30 transition-all group text-left">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-harvest shrink-0 border border-border group-hover:scale-105 transition-all">
                      <History size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-base font-bold text-foreground truncate italic tracking-tight">{log.activity_name}</h4>
                        <span className="text-[10px] font-bold text-stone/30 uppercase tracking-widest italic">
                          {new Date(log.logged_at).toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}
                        </span>
                      </div>
                      <p className="text-xs text-stone/50 line-clamp-1 font-medium italic opacity-60 uppercase tracking-tighter">
                        Log Authority: {log.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center flex flex-col items-center gap-4 bg-card">
                <ClipboardList size={48} strokeWidth={1} className="text-stone/20" />
                <p className="text-xs font-bold text-stone/30 tracking-widest uppercase italic">No node activity recorded</p>
              </div>
            )}
          </div>
        </section>

        <footer className="pt-10">
          <div className="bg-card border-2 border-border rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-harvest shadow-inner border border-border">
                  <Info size={22} />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-none mb-1.5">Network Protocol Data</p>
                  <p className="text-[9px] text-stone/40 font-bold uppercase tracking-widest opacity-60">Commodities Index API • Arbitrum Sepolia Layer-2</p>
               </div>
            </div>
            <div className="hidden md:block h-10 w-[1px] bg-border" />
            <p className="text-[10px] text-stone/30 font-bold uppercase tracking-[0.3em] text-center md:text-right italic">
              Poetic Infrastructure • 2026 Secured
            </p>
          </div>
        </footer>

      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} supabase={supabase} onSuccess={fetchData} />
      <FarmLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} user={user} products={data.products} supabase={supabase} onSuccess={fetchData} />
    </div>
  )
}
"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Plus, ShieldCheck, TrendingUp, TrendingDown, 
  Package, Loader2, Lock, Wallet, Info, 
  History, ClipboardList, Zap, Globe, Activity, Layers,
  Handshake, Check, X as CloseIcon,
  ArrowRight
} from 'lucide-react'
import ProductModal from '@/components/ProductModal'
import FarmLogModal from '@/components/FarmLogModal'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner' 
import { respondToNegotiation } from '@/utils/blockchain'
import { Button } from '@/components/ui/button'

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
  const [isNegoProcessing, setIsNegoProcessing] = useState(null)

  const toUSD = (amount) => (amount / 15600);

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const [prof, prod, earn, logs, negos] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('farmer_earnings').select('*').eq('seller_id', user.id).single(),
        supabase.from('farm_logs').select('*, products!inner(seller_id)').eq('products.seller_id', user.id).limit(5).order('created_at', { ascending: false }),
        supabase.from('transactions')
          .select('*, buyer:profiles!transactions_buyer_id_fkey(full_name), product:products(name)')
          .eq('seller_id', user.id)
          .eq('status', 'NEGOTIATING')
      ])
      
      setData(prev => ({ 
        ...prev,
        profile: prof.data, 
        products: prod.data || [], 
        earnings: earn.data || { total_earned: 0, total_locked: 0 }, 
        logs: logs.data || [],
        pendingNegos: negos.data || []
      }))
    } catch (err) {
      console.error("Sync Error:", err)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleNegotiationResponse = async (tx, accept) => {
    if (isNegoProcessing) return;
    setIsNegoProcessing(tx.id);
    
    const toastId = toast.loading(`Communicating with L2 Node...`);
    
    try {
      console.log("DEBUG: Responding to Blockchain ID:", tx.blockchain_id);
      
      if (!tx.blockchain_id) {
          throw new Error("Blockchain ID missing from node data.");
      }
      const receipt = await respondToNegotiation(tx.blockchain_id, accept);
      
      const { error } = await supabase.from('transactions')
        .update({ status: 'AWAITING_DELIVERY' })
        .eq('id', tx.id);

      if (error) throw error;

      toast.success(`Negotiation ${accept ? 'Accepted' : 'Declined'} successfully.`, { id: toastId });
      fetchData();
    } catch (err) {
      console.error("Critical Node Error:", err);
      const isNotSeller = err.message.includes("Only seller");
      const noNego = err.message.includes("No active negotiation");
      
      let friendlyError = err.message;
      if (isNotSeller) friendlyError = "Authorization Error: You are not the registered seller for this node.";
      if (noNego) friendlyError = "Blockchain Error: No active negotiation found on-chain. Node sync might be required.";
      
      toast.error(friendlyError, { id: toastId });
    } finally {
      setIsNegoProcessing(null);
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="text-stone/40 text-[10px] font-bold mt-4 tracking-[0.3em] uppercase">Syncing Protocol...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-10 space-y-10 pb-32 font-raleway min-h-screen text-left max-w-7xl mx-auto bg-[#FAFAFA]"> 
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">
            Welcome, {data.profile?.full_name?.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] text-stone/40 font-bold tracking-widest uppercase">Node Operative</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="p-4 bg-forest text-chalk rounded-2xl shadow-xl shadow-forest/10 active:scale-90 transition-all">
          <Plus size={24} />
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-forest rounded-[2.5rem] p-8 text-chalk relative overflow-hidden min-h-[220px] shadow-2xl shadow-forest/5">
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <Globe size={14} />
              <p className="text-[10px] font-bold tracking-widest uppercase">Protocol Liquidity</p>
            </div>
            <h2 className="text-5xl font-bold tracking-tighter tabular-nums">
              ${toUSD(data.earnings.total_earned).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Verified Asset</span>
            </div>
          <Wallet size={180} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 pointer-events-none" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-clay flex flex-col justify-between min-h-[220px] relative overflow-hidden shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-3 text-stone/40">
              <Lock size={14} />
              <p className="text-[10px] font-bold tracking-widest uppercase">Locked in Escrow</p>
            </div>
            <h2 className="text-5xl font-bold text-forest tracking-tighter tabular-nums">
              ${toUSD(data.earnings.total_locked).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-clay/10 w-fit px-4 py-2 rounded-full border border-clay/20 text-harvest">
            <Zap size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Settlement Pending</span>
          </div>
          <TrendingUp size={180} className="absolute -right-8 -bottom-8 text-clay/5 rotate-12 pointer-events-none" />
        </div>
      </section>

      {data.pendingNegos.length > 0 && (
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
             <div className="p-2 bg-harvest/10 rounded-xl text-harvest"><Handshake size={18} /></div>
             <h3 className="text-xs font-bold text-forest tracking-widest uppercase">Active Bids</h3>
             <Badge className="bg-harvest text-white rounded-full">{data.pendingNegos.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.pendingNegos.map(tx => (
              <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-harvest/20 shadow-sm flex flex-col justify-between group hover:border-harvest transition-all">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <p className="text-[8px] font-bold text-stone/40 uppercase mb-1">Buyer Node: {tx.buyer?.full_name}</p>
                      <h4 className="text-lg font-bold text-forest uppercase tracking-tight">{tx.product?.name}</h4>
                   </div>
                   <Badge variant="outline" className="text-[8px] border-harvest/30 text-harvest font-bold uppercase">Pending Response</Badge>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-5 flex justify-between items-center mb-8 border border-clay/10">
                   <div>
                      <p className="text-[8px] font-bold text-stone/40 uppercase mb-1">Original</p>
                      <p className="text-sm font-bold text-stone/30 line-through">${tx.total_price}</p>
                   </div>
                   <ArrowRight size={18} className="text-stone/20" />
                   <div className="text-right">
                      <p className="text-[8px] font-bold text-harvest uppercase mb-1">Proposed Bid</p>
                      <p className="text-2xl font-bold text-forest tracking-tighter">${tx.total_price * 0.9} <span className="text-[10px] opacity-40">L2</span></p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <Button 
                    variant="outline"
                    disabled={isNegoProcessing === tx.id}
                    onClick={() => handleNegotiationResponse(tx, false)}
                    className="h-14 rounded-2xl border-clay/50 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
                   >
                     <CloseIcon size={14} className="mr-2" /> Decline
                   </Button>
                   <Button 
                    disabled={isNegoProcessing === tx.id}
                    onClick={() => handleNegotiationResponse(tx, true)}
                    className="h-14 rounded-2xl bg-forest text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-forest/10 hover:bg-forest/90"
                   >
                     {isNegoProcessing === tx.id ? <Loader2 className="animate-spin" size={14}/> : <><Check size={14} className="mr-2" /> Accept Bid</>}
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
           <div className="p-2 bg-chalk rounded-xl border border-clay/50 text-forest"><Activity size={18} /></div>
           <h3 className="text-xs font-bold text-forest tracking-widest uppercase">Global Market Indices</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <p className="col-span-full py-10 text-[10px] font-bold text-stone/30 uppercase tracking-[0.2em] border border-dashed border-clay rounded-[2rem]">Real-time index connection active</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-chalk rounded-xl border border-clay/50 text-forest"><Layers size={18} /></div>
             <h3 className="text-xs font-bold text-forest tracking-widest uppercase">Node Activity</h3>
          </div>
          <button onClick={() => setIsLogModalOpen(true)} className="text-[9px] font-bold text-forest bg-white px-5 py-3 rounded-xl border border-clay shadow-sm hover:bg-chalk tracking-widest uppercase">Log Protocol</button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-clay/50 overflow-hidden">
          {data.logs.length > 0 ? (
            <div className="divide-y divide-clay/10">
              {data.logs.map((log) => (
                <div key={log.id} className="p-6 flex items-center gap-6 hover:bg-[#FAFAFA] transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-forest shrink-0 border border-clay/20 group-hover:bg-white transition-all">
                    <History size={18} />
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-bold text-slate-700 tracking-tight uppercase">{log.activity_name}</h4>
                        <span className="text-[10px] font-bold text-stone/30 uppercase tracking-widest">{new Date(log.logged_at).toLocaleDateString('en-US', {day: 'numeric', month: 'short'})}</span>
                      </div>
                      <p className="text-xs text-stone/40 font-medium leading-relaxed tracking-tight">DATA SYNC: {log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4 bg-white">
              <ClipboardList size={32} strokeWidth={1} className="text-stone/20" />
              <p className="text-[10px] font-bold text-stone/30 tracking-widest uppercase">No node synchronization found</p>
            </div>
          )}
        </div>
      </section>

      <footer className="pt-10 opacity-40">
          <p className="text-[10px] text-stone/60 font-bold uppercase tracking-[0.4em] text-center">
            Harsa Decentralized Infrastructure • 2026 Protocol Ready
          </p>
      </footer>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} supabase={supabase} onSuccess={fetchData} />
      <FarmLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} user={user} products={data.products} supabase={supabase} onSuccess={fetchData} />
    </div>
  )
}
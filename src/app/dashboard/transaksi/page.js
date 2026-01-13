"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Loader2, MessageSquare, X, Search, 
  MapPin, CheckCircle2, ShoppingBag, ArrowRight, Filter, Truck
} from 'lucide-react'
import { confirmDelivery } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export default function PesananSaya() {
  const { user, supabase } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { if (user) fetchPurchases() }, [user])

  useEffect(() => {
    let result = purchases
    if (statusFilter !== "ALL") {
      result = result.filter(p => p.status === statusFilter)
    }
    if (searchTerm) {
      result = result.filter(p => 
        p.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredPurchases(result)
  }, [searchTerm, statusFilter, purchases])

  const fetchPurchases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *, 
        product:products(name), 
        seller:profiles!transactions_seller_id_fkey(id, full_name),
        buyer:profiles!transactions_buyer_id_fkey(latitude, longitude),
        updates:shipping_updates(*)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error) setPurchases(data)
    setLoading(false)
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const formatUSD = (val) => {
    const usdValue = val / 15600;
    return usdValue.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  const handleConfirmReceipt = async (tx) => {
    setConfirmingId(tx.id)
    try {
      if (!tx.blockchain_id) throw new Error("Blockchain ID not found.");
      const receipt = await confirmDelivery(tx.blockchain_id);
      if (receipt.status === 'success') {
        const { error } = await supabase.from('transactions').update({ status: 'COMPLETE' }).eq('id', tx.id);
        if (error) throw error;
        alert("Node Synchronized! Funds released.");
        fetchPurchases();
      }
    } catch (err) { 
      alert("Verification Failed: " + (err.shortMessage || err.message));
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={32} />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 font-raleway bg-white min-h-screen pb-32 text-left">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-forest tracking-tighter uppercase italic leading-none">Acquisitions</h1>
          <p className="text-stone/60 text-sm mt-2 tracking-tight">Supply chain node management & settlement.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] font-black text-stone/40 tracking-[0.3em] bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {purchases.length} active ledger entries
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/30 group-focus-within:text-forest transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search acquisitions by product or ID..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-forest/5 text-sm transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/40 pointer-events-none" size={16} />
          <select 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full md:w-56 pl-12 pr-10 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none text-[11px] font-bold text-forest tracking-widest cursor-pointer hover:bg-slate-100 transition-all shadow-sm"
          >
            <option value="ALL">All Nodes</option>
            <option value="AWAITING_DELIVERY">To Ship</option>
            <option value="SHIPPED">In Transit</option>
            <option value="COMPLETE">Settled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        {filteredPurchases.map(tx => {
          const lastUpdate = tx.updates && tx.updates.length > 0 
            ? [...tx.updates].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0] 
            : null;
          
          let isNear = false;
          if (lastUpdate && tx.buyer?.latitude && tx.buyer?.longitude) {
            const dist = getDistance(lastUpdate.latitude, lastUpdate.longitude, tx.buyer.latitude, tx.buyer.longitude);
            if (dist <= 2) isNear = true;
          }

          return (
            <Card key={tx.id} className="rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-forest/5 transition-all duration-500 overflow-hidden flex flex-col bg-white">
              <CardContent className="p-8 flex flex-col h-full gap-6">
                
                <div className="flex justify-between items-center">
                  <Badge className={`border-none font-bold px-4 py-1.5 rounded-full text-[10px] tracking-widest ${
                    tx.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {tx.status.replace('_', ' ')}
                  </Badge>
                  <button onClick={() => setActiveChat(tx)} className="p-3 bg-slate-50 text-forest rounded-2xl hover:bg-forest hover:text-white transition-all shadow-sm active:scale-90">
                    <MessageSquare size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-forest truncate italic uppercase tracking-tighter mb-1">{tx.product?.name}</h3>
                  <div className="flex items-center gap-2 opacity-40">
                    <ShoppingBag size={12} className="text-stone" />
                    <span className="text-[10px] font-bold text-stone tracking-widest truncate">{tx.seller?.full_name}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-[1.8rem] border transition-all duration-500 ${isNear && tx.status === 'SHIPPED' ? 'bg-emerald-50/50 border-emerald-100 shadow-inner' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl shadow-sm ${isNear && tx.status === 'SHIPPED' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-harvest text-white'}`}>
                      {isNear && tx.status === 'SHIPPED' ? <Package size={16} /> : <MapPin size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-stone/40 uppercase tracking-[0.2em] leading-none mb-1.5">Last Known Node</p>
                      <p className="text-[11px] font-bold text-forest truncate tracking-tighter italic">
                        {lastUpdate ? lastUpdate.location : 'Pending Node Sync'}
                      </p>
                    </div>
                  </div>
                  {isNear && tx.status === 'SHIPPED' && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 px-1 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 size={14} className="animate-pulse" />
                      <p className="text-[10px] font-bold tracking-[0.1em]">Ready for Verification</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-6 border-y border-slate-50 mt-auto">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-stone/40 tracking-widest">
                    <Truck size={14} className="text-harvest opacity-70" />
                    {tx.amount_kg} kg
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-stone/40 tracking-widest mb-1">Value</p>
                    <p className="text-2xl font-bold text-forest tabular-nums italic tracking-tighter leading-none break-all">{formatUSD(tx.total_price)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="col-span-1 sm:col-span-3 order-2 sm:order-1">
                  {isNear && tx.status === 'SHIPPED' ? (
                    <Button 
                      onClick={() => handleConfirmReceipt(tx)} 
                      disabled={confirmingId === tx.id}
                      className="w-full bg-forest hover:bg-emerald-700 text-white rounded-[1.2rem] font-bold text-[10px] h-14 tracking-[0.2em] shadow-xl shadow-forest/10 transition-all active:scale-95"
                    >
                      {confirmingId === tx.id ? <Loader2 className="animate-spin" size={18} /> : "Settle Node"}
                    </Button>
                  ) : tx.status === 'COMPLETE' ? (
                    <div className="flex items-center justify-center gap-2 h-14 bg-emerald-50 rounded-[1.2rem] text-emerald-600 border border-emerald-100/50">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-bold tracking-widest">On-Chain Settled</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center px-4 bg-slate-50 rounded-[1.2rem] h-14 border border-slate-100">
                      <p className="text-[9px] text-stone/40 font-bold tracking-widest text-center leading-tight italic">
                        {tx.status === 'SHIPPED' ? 'In Transit' : 'Preparing'}
                      </p>
                    </div>
                  )}
                  </div>
                  
                  <Link href={`/dashboard/transaksi/${tx.id}`} className="col-span-1 sm:col-span-2 order-1 sm:order-2">
                    <Button variant="outline" className="w-full rounded-[1.2rem] border-slate-200 text-forest font-bold text-[10px] h-14 tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      Logs <ArrowRight size={12} />
                    </Button>
                  </Link>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeChat && (
        <div className="fixed inset-x-4 bottom-6 md:inset-auto md:bottom-10 md:right-10 md:w-[420px] z-[130]">
          <div className="relative group shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border border-slate-100">
            <button 
              onClick={() => setActiveChat(null)} 
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-stone/40 hover:text-red-500 transition-all z-20 active:scale-90"
            >
              <X size={20} />
            </button>
            <ChatWindow receiverId={activeChat.seller?.id} receiverName={activeChat.seller?.full_name} transactionId={activeChat.id} isMobileDrawer={false} />
          </div>
        </div>
      )}
    </div>
  )
}
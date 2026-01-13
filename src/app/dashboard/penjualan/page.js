"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Loader2, MessageSquare, X, Search, 
  MapPin, CheckCircle2, Truck, ShoppingBag, ArrowRight, Filter, Clock
} from 'lucide-react'
import ChatWindow from '@/components/ChatWindow'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'

export default function PenjualanPage() {
  const { user, supabase } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { if (user) fetchSales() }, [user])

  const fetchSales = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *, 
        product:products(name), 
        buyer:profiles!transactions_buyer_id_fkey(id, full_name, location),
        updates:shipping_updates(*)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error) setSales(data)
    setLoading(false)
  }

  
  const formatUSD = (val) => (val / 15600).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // const formatUSD = (val) => {
  //   const usdValue = val / 15600;
  //   return usdValue.toLocaleString('en-US', { 
  //     style: 'currency', 
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 18
  //   });
  // };

  const handleUpdateStatus = async (txId) => {
    setUpdatingId(txId)
    const { error } = await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', txId)
    if (!error) {
      await supabase.from('shipping_updates').insert({
        transaction_id: txId,
        location: 'Merchant Node',
        status_description: 'Parcel has been dispatched from origin'
      })
      await fetchSales()
      alert("Status updated to: SHIPPED")
    }
    setUpdatingId(null)
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-forest" size={32} /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 font-raleway bg-white min-h-screen pb-32 text-left">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-forest tracking-tighter leading-none">Merchant Sales</h1>
          <p className="text-stone/60 text-sm mt-2 tracking-tight">Monitor outgoing orders and supply chain updates.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 font-bold text-[10px] text-stone/40 tracking-[0.3em] bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
          <Clock size={12} className="text-harvest" />
          {sales.length} Active Sales Node
        </div>
      </div>

      <Tabs defaultValue="AWAITING_DELIVERY" className="w-full">
        <TabsList className="bg-slate-50 p-1.5 rounded-[1.5rem] mb-12 inline-flex h-auto border border-slate-100 shadow-sm ml-2">
          <TabsTrigger value="AWAITING_DELIVERY" className="rounded-xl px-6 py-2.5 text-[10px] tracking-widest data-[state=active]:bg-forest data-[state=active]:text-white transition-all">To Ship</TabsTrigger>
          <TabsTrigger value="SHIPPED" className="rounded-xl px-6 py-2.5 text-[10px] tracking-widest data-[state=active]:bg-forest data-[state=active]:text-white transition-all">Shipped</TabsTrigger>
          <TabsTrigger value="COMPLETE" className="rounded-xl px-6 py-2.5 text-[10px] tracking-widest data-[state=active]:bg-forest data-[state=active]:text-white transition-all">Settled</TabsTrigger>
        </TabsList>

        {['AWAITING_DELIVERY', 'SHIPPED', 'COMPLETE'].map(status => (
          <TabsContent key={status} value={status} className="px-2 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sales.filter(s => s.status === status).map(tx => {
                const lastUpdate = tx.updates && tx.updates.length > 0 
                  ? [...tx.updates].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0] 
                  : null;

                return (
                  <Card key={tx.id} className="rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-forest/5 transition-all duration-500 overflow-hidden flex flex-col bg-white">
                    <CardContent className="p-8 flex flex-col h-full gap-6">
                      
                      <div className="flex justify-between items-center">
                        <Badge className={`border-none px-4 py-1.5 rounded-full text-[10px] tracking-widest ${
                          tx.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {tx.status.replace('_', ' ')}
                        </Badge>
                        <button onClick={() => setActiveChat(tx)} className="p-3 bg-slate-50 text-forest rounded-2xl hover:bg-forest hover:text-white transition-all active:scale-90 shadow-sm">
                          <MessageSquare size={18} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-forest truncate tracking-tighter mb-1">{tx.product?.name}</h3>
                        <div className="flex items-center gap-2 opacity-40">
                          <ShoppingBag size={12} className="text-stone" />
                          <span className="text-[10px] font-bold text-stone tracking-widest truncate">Buyer: {tx.buyer?.full_name}</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-[1.8rem] bg-slate-50 border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-harvest text-white shadow-sm">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-stone/40 tracking-[0.2em] leading-none mb-1.5">Last update point</p>
                            <p className="text-[11px] font-bold text-forest truncate tracking-tighter">
                              {lastUpdate ? lastUpdate.location : 'Origin Warehouse'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-6 border-y border-slate-50 mt-auto">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-stone/40 tracking-widest">
                          <Package size={14} className="text-harvest opacity-70" />
                          {tx.amount_kg} kg
                        </div>
                        <div className="text-right min-w-0">
                          <p className="text-[10px] font-bold text-stone/40 tracking-widest mb-1 leading-none">Earnings</p>
                          <p className="text-xl text-forest tabular-nums tracking-tighter leading-none break-all">
                            {formatUSD(tx.total_price)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div className="col-span-1 sm:col-span-3 order-2 sm:order-1">
                        {tx.status === 'AWAITING_DELIVERY' ? (
                          <Button 
                            onClick={() => handleUpdateStatus(tx.id)} 
                            disabled={updatingId === tx.id}
                            className="w-full bg-forest hover:bg-emerald-700 text-white rounded-[1.2rem] font-bold text-[10px] h-14 tracking-[0.2em] shadow-xl shadow-forest/10 transition-all active:scale-95"
                          >
                            {updatingId === tx.id ? <Loader2 className="animate-spin" size={18} /> : <><Truck size={14} className="mr-2"/> Dispatch Parcel</>}
                          </Button>
                        ) : tx.status === 'COMPLETE' ? (
                          <div className="flex items-center justify-center gap-2 h-14 bg-emerald-50 rounded-[1.2rem] text-emerald-600 border border-emerald-100/50">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] tracking-widest">Node Settled</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center px-4 bg-slate-50 rounded-[1.2rem] h-14 border border-slate-100">
                            <p className="text-[9px] text-stone/40 font-bold tracking-widest text-center leading-tight">
                              In Delivery Phase
                            </p>
                          </div>
                        )}
                        </div>
                        
                        <Link href={`/dashboard/transaksi/${tx.id}`} className="col-span-1 sm:col-span-2 order-1 sm:order-2">
                          <Button variant="outline" className="w-full rounded-[1.2rem] border-slate-200 text-forest font-bold text-[10px] h-14 tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            Details <ArrowRight size={12} />
                          </Button>
                        </Link>
                      </div>

                    </CardContent>
                  </Card>
                )
              })}
              {sales.filter(s => s.status === status).length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <div className="bg-slate-50 inline-flex p-6 rounded-full mb-4">
                    <Package className="text-stone/20" size={40} />
                  </div>
                  <p className="text-stone/40 font-bold tracking-widest text-xs">No transactions found in this node stage.</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {activeChat && (
        <div className="fixed inset-x-4 bottom-6 md:inset-auto md:bottom-10 md:right-10 md:w-[420px] z-[130]">
          <div className="relative group shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border border-slate-100">
            <button 
              onClick={() => setActiveChat(null)} 
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-stone/40 hover:text-red-500 transition-all z-20 active:scale-90"
            >
              <X size={20} />
            </button>
            <ChatWindow receiverId={activeChat.buyer?.id} receiverName={activeChat.buyer?.full_name} transactionId={activeChat.id} isMobileDrawer={false} />
          </div>
        </div>
      )}
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Loader2, MessageSquare, X, Search, 
  MapPin, CheckCircle2, Truck, ShoppingBag, ArrowRight, Filter, Clock,
  Coins, Globe, Layers, Navigation
} from 'lucide-react'
import ChatWindow from '@/components/ChatWindow'
import { getMarketRates } from '@/utils/blockchain'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import { toast } from 'sonner'
import ThemeToggle from '@/components/ThemeToggle'

export default function PenjualanPage() {
  const { user, supabase } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [rates, setRates] = useState(null)

  useEffect(() => { 
    if (user) fetchInitialData() 
  }, [user])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [salesRes, marketRates] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            *, 
            product:products(name), 
            buyer:profiles!transactions_buyer_id_fkey(id, full_name, location),
            updates:shipping_updates(*)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false }),
        getMarketRates()
      ])
      
      if (!salesRes.error) setSales(salesRes.data)
      setRates(marketRates)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (txId) => {
    setUpdatingId(txId)
    const toastId = toast.loading("Authorizing parcel dispatch on-chain...")
    
    try {
      const { error: txError } = await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', txId)
      if (txError) throw txError

      const { error: logError } = await supabase.from('shipping_updates').insert({
        transaction_id: txId,
        location: 'Merchant Node',
        status_description: 'Parcel has been authorized and dispatched from origin node.'
      })
      if (logError) throw logError

      toast.success("Node Status: SHIPPED", { id: toastId })
      await fetchInitialData()
    } catch (err) {
      toast.error("Dispatch failed: " + err.message, { id: toastId })
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse italic">Synchronizing Sales Ledger...</p>
    </div>
  )

  const ethToUsd = (val) => rates ? (val * rates.ethToUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "...";

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 font-raleway bg-background text-foreground min-h-screen pb-32 text-left transition-colors duration-500">
      
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 animate-in fade-in duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter italic leading-none">Merchant Sales<span className="text-harvest">.</span></h1>
          <p className="text-stone/40 text-xs font-bold tracking-widest uppercase italic">Outgoing fulfillment & Logistics console</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
           <Clock size={16} className="text-harvest" />
           <span className="text-[10px] font-bold text-stone/50 uppercase tracking-widest">{sales.length} active nodes</span>
        </div>
      </header>

      <Tabs defaultValue="AWAITING_DELIVERY" className="w-full">
        <TabsList className="bg-muted p-1.5 rounded-[2rem] mb-12 inline-flex h-auto border border-border shadow-inner ml-2">
          <TabsTrigger value="AWAITING_DELIVERY" className="rounded-[1.5rem] px-8 py-3 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-forest dark:data-[state=active]:bg-harvest data-[state=active]:text-white transition-all">To Ship</TabsTrigger>
          <TabsTrigger value="SHIPPED" className="rounded-[1.5rem] px-8 py-3 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-forest dark:data-[state=active]:bg-harvest data-[state=active]:text-white transition-all">In Transit</TabsTrigger>
          <TabsTrigger value="COMPLETE" className="rounded-[1.5rem] px-8 py-3 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-forest dark:data-[state=active]:bg-harvest data-[state=active]:text-white transition-all">Settled</TabsTrigger>
        </TabsList>

        {['AWAITING_DELIVERY', 'SHIPPED', 'COMPLETE'].map(status => (
          <TabsContent key={status} value={status} className="px-2 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sales.filter(s => s.status === status).map(tx => {
                const lastUpdate = tx.updates && tx.updates.length > 0 
                  ? [...tx.updates].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0] 
                  : null;

                return (
                  <Card key={tx.id} className="rounded-[3rem] border-2 border-border shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col bg-card group relative">
                    <CardContent className="p-8 flex flex-col h-full gap-8">
                      
                      <div className="flex justify-between items-center">
                        <Badge className={`border-none font-black px-4 py-1.5 rounded-xl text-[10px] tracking-widest uppercase italic ${
                          tx.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-harvest/10 text-harvest'
                        }`}>
                          {tx.status.replace('_', ' ')}
                        </Badge>
                        <button onClick={() => setActiveChat(tx)} className="p-3 bg-muted text-stone/40 hover:text-harvest rounded-2xl transition-all active:scale-90">
                          <MessageSquare size={18} />
                        </button>
                      </div>

                      <div className="text-left space-y-1">
                        <h3 className="text-2xl font-bold tracking-tight italic leading-none">{tx.product?.name}</h3>
                        <p className="text-[10px] font-bold text-stone/30 uppercase tracking-[0.2em] italic">Buyer: {tx.buyer?.full_name}</p>
                      </div>

                      <div className="p-6 rounded-[2.5rem] bg-muted border-2 border-border text-left">
                        <div className="flex items-center gap-5">
                          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm text-harvest">
                            <MapPin size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest mb-1.5 leading-none">Last Known Node</p>
                            <p className="text-sm font-bold truncate italic tracking-tight text-foreground">
                              {lastUpdate ? lastUpdate.location : 'Origin Warehouse'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-4 mt-auto border-t border-border">
                        <div className="text-left space-y-1">
                          <span className="text-[9px] font-bold text-stone/30 uppercase tracking-widest">Protocol Value</span>
                          <div className="flex items-center gap-1.5 text-forest dark:text-harvest">
                             <Coins size={14} />
                             <p className="text-2xl font-bold tabular-nums tracking-tighter leading-none">{tx.total_price}</p>
                          </div>
                          <p className="text-[10px] font-bold text-stone/40 italic">≈ {ethToUsd(tx.total_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-stone/40 italic">{tx.amount_kg} KG Asset</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {tx.status === 'AWAITING_DELIVERY' ? (
                          <Button 
                            onClick={() => handleUpdateStatus(tx.id)} 
                            disabled={updatingId === tx.id}
                            className="w-full bg-forest dark:bg-harvest text-white rounded-[2rem] h-16 font-bold uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            {updatingId === tx.id ? <Loader2 className="animate-spin" /> : <><Truck size={18} className="mr-2"/> Authorize Dispatch</>}
                          </Button>
                        ) : tx.status === 'COMPLETE' ? (
                          <div className="flex items-center justify-center gap-3 h-16 bg-emerald-500/10 rounded-[2rem] text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Settled On-Chain</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3 h-16 bg-muted rounded-[2rem] border border-border">
                             <Navigation size={16} className="text-harvest animate-pulse" />
                             <p className="text-[10px] text-stone/40 font-bold uppercase tracking-widest">Awaiting Buyer Confirmation</p>
                          </div>
                        )}
                        
                        <Link href={`/dashboard/transaksi/${tx.id}`}>
                          <Button variant="outline" className="w-full h-14 rounded-[2rem] border-border text-stone/40 hover:text-harvest font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn">
                            Detailed Logs <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                          </Button>
                        </Link>
                      </div>

                    </CardContent>
                  </Card>
                )
              })}
              {sales.filter(s => s.status === status).length === 0 && (
                <div className="col-span-full py-32 text-center bg-card rounded-[4rem] border-2 border-dashed border-border flex flex-col items-center">
                  <Package className="text-stone/10 mb-6" size={64} strokeWidth={1} />
                  <p className="text-stone/40 font-bold tracking-widest text-xs italic uppercase">No active nodes in this protocol stage.</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {activeChat && (
        <div className="fixed inset-x-4 bottom-6 md:inset-auto md:bottom-10 md:right-10 md:w-[450px] z-[130] animate-in slide-in-from-bottom-10 duration-500">
          <div className="relative group shadow-2xl rounded-[3rem] overflow-hidden bg-card border-2 border-border">
            <div className="absolute top-6 right-6 z-20">
               <button 
                onClick={() => setActiveChat(null)} 
                className="w-10 h-10 bg-background border border-border rounded-full shadow-lg flex items-center justify-center text-stone/40 hover:text-red-500 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
            <ChatWindow receiverId={activeChat.buyer?.id} receiverName={activeChat.buyer?.full_name} transactionId={tx.id} />
          </div>
        </div>
      )}
    </div>
  )
}
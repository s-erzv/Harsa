"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Loader2, MessageSquare, X, Search, 
  MapPin, CheckCircle2, ShoppingBag, ArrowRight, Filter, Truck,
  Star, Send, Coins, Globe, Layers, Navigation,
  ShieldCheck
} from 'lucide-react'
import ChatWindow from '@/components/ChatWindow'
import { getMarketRates } from '@/utils/blockchain'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from 'next/link'
import { toast } from 'sonner'
import ThemeToggle from '@/components/ThemeToggle'

export default function PesananSaya() {
  const { user, supabase } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [rates, setRates] = useState(null)
  
  const [reviewingTx, setReviewingTx] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => { 
    if (user) {
      fetchInitialData()
    }
  }, [user])

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

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [txRes, marketRates] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            *, 
            product:products(name), 
            seller:profiles!transactions_seller_id_fkey(id, full_name, wallet_address),
            buyer:profiles!transactions_buyer_id_fkey(latitude, longitude),
            updates:shipping_updates(*),
            reviews(*)
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false }),
        getMarketRates()
      ])
      
      if (!txRes.error) setPurchases(txRes.data)
      setRates(marketRates)
    } finally {
      setLoading(false)
    }
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const handleConfirmReceipt = async (tx) => {
    setConfirmingId(tx.id);
    const toastId = toast.loading("Verifying delivery node on Arbitrum...");
    try {
      const response = await fetch('/api/confirm-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockchainTxId: tx.blockchain_id })
      });
      const result = await response.json();

      if (result.success) {
        await supabase.from('transactions').update({ status: 'COMPLETE' }).eq('id', tx.id);
        toast.success("Identity Verified! Funds released to producer.", { id: toastId });
        fetchInitialData();
        setReviewingTx(tx);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast.error("Execution failed: " + err.message, { id: toastId });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewingTx) return;
    setSubmittingReview(true);
    const toastId = toast.loading("Committing review to reputation layer...");
    try {
      const { error } = await supabase.from('reviews').insert({
        transaction_id: reviewingTx.id,
        buyer_id: user.id,
        seller_id: reviewingTx.seller_id,
        rating,
        comment
      });

      if (error) throw error;

      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', reviewingTx.seller_id);
      
      const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
      const newScore = Math.round(avgRating * 20);

      await supabase.from('profiles').update({ reputation_score: newScore }).eq('id', reviewingTx.seller_id);

      setReviewingTx(null);
      setComment("");
      setRating(5);
      fetchInitialData();
      toast.success("Review submitted! The trust network is secured.", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse italic">Synchronizing Ledger...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 font-raleway bg-background text-foreground min-h-screen pb-32 text-left transition-colors duration-500">
      
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 animate-in fade-in duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter italic leading-none lowercase">Acquisitions<span className="text-harvest">.</span></h1>
          <p className="text-stone/40 text-xs font-bold tracking-widest uppercase italic">Node Settlement & Procurement</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
           <Layers size={16} className="text-harvest" />
           <span className="text-[10px] font-bold text-stone/50 uppercase tracking-widest">{purchases.length} Ledger Entries</span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-12 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/20 group-focus-within:text-harvest transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search assets, IDs, or producers..."
            className="w-full h-16 pl-14 pr-6 py-4 rounded-[2rem] bg-card border-2 border-border outline-none focus:border-harvest transition-all text-sm font-semibold italic shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/40 pointer-events-none" size={18} />
          <select 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full md:w-56 pl-12 pr-10 h-16 rounded-[2rem] bg-card border-2 border-border outline-none text-[10px] font-bold text-foreground cursor-pointer hover:border-harvest transition-all shadow-sm uppercase tracking-widest"
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

          const hasReviewed = tx.reviews && tx.reviews.length > 0;
          const currentRates = rates?.ethToUsd || 0;

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
                  <p className="text-[10px] font-bold text-stone/30 uppercase tracking-[0.2em] italic">Producer: {tx.seller?.full_name}</p>
                </div>

                <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 text-left ${isNear && tx.status === 'SHIPPED' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-muted border-border'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl shadow-xl ${isNear && tx.status === 'SHIPPED' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-harvest text-white'}`}>
                      {isNear && tx.status === 'SHIPPED' ? <Package size={20} /> : <Navigation size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest mb-1.5 leading-none">Last Known Hub</p>
                      <p className="text-sm font-bold truncate italic tracking-tight">
                        {lastUpdate ? lastUpdate.location : 'Detecting Node...'}
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
                    <p className="text-[10px] font-bold text-stone/40 italic">≈ ${(tx.total_price * currentRates).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-stone/40 italic">{tx.amount_kg} KG Asset</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {isNear && tx.status === 'SHIPPED' ? (
                    <Button 
                      onClick={() => handleConfirmReceipt(tx)} 
                      disabled={confirmingId === tx.id}
                      className="w-full bg-forest dark:bg-harvest text-white rounded-[2rem] h-16 font-bold uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {confirmingId === tx.id ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} className="mr-2" /> Authorize Settlement</>}
                    </Button>
                  ) : tx.status === 'COMPLETE' ? (
                    <div className="space-y-3">
                       <div className="flex items-center justify-center gap-3 h-14 bg-emerald-500/10 rounded-[2rem] text-emerald-500 border border-emerald-500/20">
                         <CheckCircle2 size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Settled On-Chain</span>
                       </div>
                       {!hasReviewed && (
                         <Button 
                           variant="outline" 
                           onClick={() => setReviewingTx(tx)}
                           className="w-full h-14 rounded-[2rem] border-harvest/50 text-harvest hover:bg-harvest/5 font-bold uppercase tracking-widest text-[10px] transition-all"
                         >
                           Rate Origin rep
                         </Button>
                       )}
                    </div>
                  ) : (
                    <Link href={`/dashboard/transaksi/${tx.id}`}>
                      <Button variant="outline" className="w-full h-16 rounded-[2rem] border-border text-stone/40 hover:text-harvest font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn">
                        Node Logs <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!reviewingTx} onOpenChange={() => setReviewingTx(null)}>
        <DialogContent className="rounded-[3rem] sm:max-w-md bg-card border-2 border-border font-raleway p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <Star size={180} />
          </div>
          <DialogHeader className="space-y-4">
            <div className="w-20 h-20 bg-harvest/10 rounded-[2rem] flex items-center justify-center mx-auto mb-2 text-harvest shadow-inner border border-harvest/20">
               <Star size={36} className="fill-harvest" />
            </div>
            <DialogTitle className="text-3xl font-bold tracking-tighter italic text-center leading-none lowercase">Rate Node Reputation<span className="text-harvest">.</span></DialogTitle>
            <DialogDescription className="text-center text-stone/50 text-xs font-medium italic">
              Your cryptographic signature on this review impacts the farmer's global standing in the Harsa network.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-4 py-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`transition-all transform active:scale-90 ${rating >= star ? 'text-harvest scale-110' : 'text-stone/20'}`}
              >
                <Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={2.5} />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Describe the asset quality and delivery performance..."
            className="rounded-[2rem] border-border bg-muted min-h-[140px] p-6 focus:border-harvest outline-none resize-none font-medium text-sm italic transition-all"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <DialogFooter className="mt-10">
            <Button
              disabled={submittingReview}
              onClick={handleSubmitReview}
              className="w-full bg-forest dark:bg-harvest text-white rounded-3xl h-16 font-bold uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
            >
              {submittingReview ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-3"><Send size={16} /> Authorize Review</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <ChatWindow receiverId={activeChat.seller?.id} receiverName={activeChat.seller?.full_name} transactionId={activeChat.id} />
          </div>
        </div>
      )}
      </div>
  )
}
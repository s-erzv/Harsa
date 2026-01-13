"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Loader2, MessageSquare, X, Search, 
  MapPin, CheckCircle2, ShoppingBag, ArrowRight, Filter, Truck,
  Star, Send
} from 'lucide-react'
import ChatWindow from '@/components/ChatWindow'
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

export default function PesananSaya() {
  const { user, supabase } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  const [reviewingTx, setReviewingTx] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

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
        updates:shipping_updates(*),
        reviews(*)
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
    return val.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  const handleConfirmReceipt = async (tx) => {
    setConfirmingId(tx.id);
    try {
      const response = await fetch('/api/confirm-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockchainTxId: tx.blockchain_id })
      });
      const result = await response.json();

      if (result.success) {
        await supabase.from('transactions').update({ status: 'COMPLETE' }).eq('id', tx.id);
        alert("Verified! Funds released. Please rate the seller.");
        fetchPurchases();
        setReviewingTx(tx);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewingTx) return;
    setSubmittingReview(true);
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
      fetchPurchases();
      alert("Review submitted! Thank you for securing the trust network.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={32} />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 font-raleway bg-white min-h-screen pb-32 text-left">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-forest tracking-tighter leading-none">Acquisitions</h1>
          <p className="text-stone/60 text-sm mt-2 tracking-tight">Supply chain node management & settlement.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] font-bold text-stone/40 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 ">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {purchases.length} Ledger Entries
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/30 group-focus-within:text-forest transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search variety, ID, or origin..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-forest/5 text-sm font-medium transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/40 pointer-events-none" size={16} />
          <select 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full md:w-56 pl-12 pr-10 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none text-[10px] font-bold text-forest  cursor-pointer hover:bg-slate-100 transition-all shadow-sm"
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

          return (
            <Card key={tx.id} className="rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-forest/5 transition-all duration-500 overflow-hidden flex flex-col bg-white group">
              <CardContent className="p-8 flex flex-col h-full gap-6">
                
                <div className="flex justify-between items-center">
                  <Badge className={`border-none font-bold px-4 py-1.5 rounded-full text-[9px]  ${
                    tx.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {tx.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveChat(tx)} className="p-3 bg-slate-50 text-forest rounded-2xl hover:bg-forest hover:text-white transition-all shadow-sm active:scale-90">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-forest truncate tracking-tighter mb-1 leading-none">{tx.product?.name}</h3>
                  <div className="flex items-center gap-2 opacity-40">
                    <ShoppingBag size={12} className="text-stone" />
                    <span className="text-[10px] font-semibold text-stone tracking-widest truncate  italic">{tx.seller?.full_name}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${isNear && tx.status === 'SHIPPED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl shadow-sm ${isNear && tx.status === 'SHIPPED' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-harvest text-white'}`}>
                      {isNear && tx.status === 'SHIPPED' ? <Package size={16} /> : <MapPin size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-stone/40  leading-none mb-1.5">Origin Sync</p>
                      <p className="text-[11px] font-semibold text-forest truncate tracking-tighter">
                        {lastUpdate ? lastUpdate.location : 'Syncing node...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-6 border-y border-slate-50 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-stone/30  mb-1">Volume</span>
                    <p className="text-sm font-semibold text-forest tracking-widest">{tx.amount_kg} KG</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-stone/30  tracking-widest mb-1">Asset Value</p>
                    <p className="text-2xl font-bold text-forest tabular-numstracking-tighter leading-none">{formatUSD(tx.total_price)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {isNear && tx.status === 'SHIPPED' ? (
                    <Button 
                      onClick={() => handleConfirmReceipt(tx)} 
                      disabled={confirmingId === tx.id}
                      className="w-full bg-forest hover:bg-emerald-700 text-white rounded-[1.5rem] font-bold text-[10px] h-14  shadow-xl shadow-forest/10 transition-all"
                    >
                      {confirmingId === tx.id ? <Loader2 className="animate-spin" size={18} /> : "Settle Node Acquisition"}
                    </Button>
                  ) : tx.status === 'COMPLETE' ? (
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-center gap-2 h-14 bg-emerald-50 rounded-[1.5rem] text-emerald-600 border border-emerald-100/50">
                         <CheckCircle2 size={16} />
                         <span className="text-[9px] font-bold ">On-Chain Settled</span>
                       </div>
                       {!hasReviewed && (
                         <Button 
                           variant="outline" 
                           onClick={() => setReviewingTx(tx)}
                           className="w-full rounded-[1.5rem] border-harvest text-harvest hover:bg-harvest/5 font-bold text-[9px] h-12  transition-all"
                         >
                           Rate Node Rep
                         </Button>
                       )}
                    </div>
                  ) : (
                    <Link href={`/dashboard/transaksi/${tx.id}`}>
                      <Button variant="outline" className="w-full rounded-[1.5rem] border-slate-100 text-stone/40 hover:text-forest font-bold text-[9px] h-14  transition-all flex items-center justify-center gap-2 group-hover:border-forest/20">
                        View Node Logs <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
        <DialogContent className="rounded-[3rem] sm:max-w-md border-none font-raleway p-10">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-harvest/10 rounded-3xl flex items-center justify-center mx-auto mb-2 text-harvest">
               <Star size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold text-forest text-center tracking-tighter">Rate Origin Node</DialogTitle>
            <DialogDescription className="text-center text-stone/60 font-medium italic">
              Your feedback impacts the farmer's global reputation score on Harsa Protocol.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-3 py-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`transition-all transform active:scale-90 ${rating >= star ? 'text-harvest scale-110' : 'text-slate-200'}`}
              >
                <Star size={36} fill={rating >= star ? "currentColor" : "none"} strokeWidth={2.5} />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Describe the quality of the harvest node..."
            className="rounded-3xl border-slate-100 bg-slate-50 min-h-[120px] p-6 focus:ring-forest/10 resize-none font-mediumtext-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <DialogFooter className="mt-8">
            <Button
              disabled={submittingReview}
              onClick={handleSubmitReview}
              className="w-full bg-forest text-white rounded-[1.5rem] h-14 font-bold text-[10px]  shadow-2xl shadow-forest/20 active:scale-95 transition-all"
            >
              {submittingReview ? <Loader2 className="animate-spin" /> : <><Send size={14} className="mr-2" /> Commit Review</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeChat && (
        <div className="fixed inset-x-4 bottom-6 md:inset-auto md:bottom-10 md:right-10 md:w-[420px] z-[130] animate-in slide-in-from-bottom-10 duration-500">
          <div className="relative group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden bg-white border border-slate-50">
            <button 
              onClick={() => setActiveChat(null)} 
              className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-stone/40 hover:text-red-500 transition-all z-20 active:scale-90"
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
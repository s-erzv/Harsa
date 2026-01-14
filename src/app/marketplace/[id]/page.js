"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkout, getEthPrice } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import { 
  ShieldCheck, ArrowLeft, ShoppingBag, Loader2, 
  Plus, Minus, MessageSquare, X, MapPin, Star, Activity, 
  Handshake, Info, Sparkles, Gavel
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user, supabase } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isNegoModalOpen, setIsNegoModalOpen] = useState(false)
  const [negoPrice, setNegoPrice] = useState("")

  useEffect(() => {
    const fetchDetail = async () => {
      try { 
        const { data: productData, error: pError } = await supabase
          .from('products')
          .select('*, profiles(*)') 
          .eq('id', id)
          .single()
        if (pError) throw pError
        setProduct(productData)
        setNegoPrice(productData.price_per_kg)
      } catch (err) {
        toast.error("Failed to load node data")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetail()
  }, [id, supabase])

  const handleProcessPurchase = async (isWithNego = false) => {
    if (!product || !product.profiles?.wallet_address) return toast.error("Invalid seller node data")
    if (buyAmount > product.stock_kg) return toast.error("Insufficient supply")
    if (!user) return toast.error("Login required")
    
    if (isWithNego) {
        toast.info("TBC wkwkwk", {
            icon: <Activity className="text-harvest" size={16} />
        });
        setIsNegoModalOpen(false);
        return;
    }

    /* 
    if (isWithNego && (!negoPrice || Number(negoPrice) >= product.price_per_kg)) {
       return toast.error("Bid must be lower than protocol price")
    }

    setIsProcessing(true)
    const toastId = toast.loading(isWithNego ? "Initializing Bid & Escrow..." : "Securing Acquisition...")

    try { 
      const currentEthPriceInUsd = await getEthPrice()
      const totalPriceInUsd = Number(product.price_per_kg * buyAmount)
      const totalEthToPayStr = (totalPriceInUsd / currentEthPriceInUsd).toFixed(18)

      const items = [{
        sellerAddress: product.profiles.wallet_address,
        priceInEth: totalEthToPayStr,
        sku: product.id            
      }]

      const { hash, blockchainIds, negoSuccess } = await checkout(items, isWithNego, negoPrice)
      const bId = blockchainIds[0].txId

      let finalStatus = 'AWAITING_DELIVERY'
      if (isWithNego && negoSuccess) finalStatus = 'NEGOTIATING'

      const { error } = await supabase.rpc('handle_buy_product', {
        p_transaction_id: crypto.randomUUID(), 
        p_product_id: product.id,
        p_amount_kg: buyAmount,
        p_blockchain_id: parseInt(bId), 
        p_tx_hash: hash,
        p_buyer_id: user.id,
        p_seller_id: product.seller_id,
        p_total_price: totalPriceInUsd,      
        p_amount_paid: Number(totalEthToPayStr),
        p_status: finalStatus
      })

      if (error) throw error

      if (isWithNego && !negoSuccess) {
          toast.warning("Payment secured, but bid failed. Status set to standard.", { id: toastId })
      } else {
          toast.success(isWithNego ? "Bid Submitted & Escrow Locked!" : "Acquisition Secured!", { id: toastId })
      }
      
      router.push('/dashboard/transaksi')
    } catch (err) {
      console.error("Acquisition Error:", err)
      toast.error(err.shortMessage || err.message || "Protocol failed", { id: toastId })
    } finally {
      setIsProcessing(false)
      setIsNegoModalOpen(false)
    }
    */

    setIsProcessing(true);
    const toastId = toast.loading("Securing Direct Acquisition...");
    
    try {
        const currentEthPriceInUsd = await getEthPrice();
        const totalPriceInUsd = Number(product.price_per_kg * buyAmount);
        const totalEthToPayStr = (totalPriceInUsd / currentEthPriceInUsd).toFixed(18);

        const items = [{
            sellerAddress: product.profiles.wallet_address,
            priceInEth: totalEthToPayStr,
            sku: product.id            
        }];

        const { hash, blockchainIds } = await checkout(items, false, null);
        const bId = blockchainIds[0].txId;

        const { error } = await supabase.rpc('handle_buy_product', {
            p_transaction_id: crypto.randomUUID(), 
            p_product_id: product.id,
            p_amount_kg: buyAmount,
            p_blockchain_id: parseInt(bId), 
            p_tx_hash: hash,
            p_buyer_id: user.id,
            p_seller_id: product.seller_id,
            p_total_price: totalPriceInUsd,      
            p_amount_paid: Number(totalEthToPayStr),
            p_status: 'AWAITING_DELIVERY'
        });

        if (error) throw error;
        toast.success("Node Acquisition Secured!", { id: toastId });
        router.push('/dashboard/transaksi');
    } catch (err) {
        toast.error("Direct Buy Failed: " + (err.shortMessage || err.message), { id: toastId });
    } finally {
        setIsProcessing(false);
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={32} /></div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-raleway pb-10 text-left">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-clay/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-stone hover:text-forest transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">Back</span>
          </button>
          <div className="flex items-center gap-2 bg-chalk px-3 py-1 rounded-full border border-clay/30">
            <Activity size={12} className="text-forest animate-pulse" />
            <span className="text-[10px] font-bold text-forest uppercase tracking-widest leading-none">Node Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-6 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          
          <div className="space-y-6">
            <div className="relative aspect-square bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-clay/10 shadow-sm group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest/5"><ShieldCheck size={100} strokeWidth={1} /></div>
              )}
              <Badge className="absolute top-4 left-4 md:top-6 md:left-6 bg-white/90 backdrop-blur-sm text-forest font-bold px-4 py-1.5 rounded-xl border-none shadow-sm text-[10px] uppercase">
                {product.category || 'Premium Asset'}
              </Badge>
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] md:rounded-[2rem] border border-clay/20 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-forest/5 rounded-2xl text-forest shrink-0"><ShieldCheck size={20} /></div>
              <div className="space-y-1">
                <p className="text-forest font-bold text-[11px] uppercase tracking-wider">Harsa Escrow Protection</p>
                <p className="text-stone/60 text-xs leading-relaxed">Funds are secured in L2 Smart Contract and only released upon delivery verification.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-6 md:space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight uppercase leading-none">{product.name}</h1>
              <div className="flex items-center gap-4 text-stone/40">
                <div className="flex items-center gap-1.5 font-bold">
                  <MapPin size={14} className="text-harvest" />
                  <span className="text-xs uppercase">{product.profiles?.location?.split(',')[0]}</span>
                </div>
                <div className="h-3 w-[1px] bg-clay" />
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="fill-harvest text-harvest" />
                  <span className="text-xs font-bold text-forest">{product.profiles?.reputation_score}% Trust Node</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-2xl md:rounded-3xl border border-clay/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-11 md:h-11 bg-forest rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                  {product.profiles?.full_name?.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[9px] font-bold text-stone/30 uppercase tracking-widest mb-0.5 leading-none">Source Node</p>
                  <Link href={`/petani/${product.seller_id}`} className="hover:text-harvest transition-colors font-bold text-forest text-sm truncate">{product.profiles?.full_name}</Link>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)} className="rounded-xl border-clay/50 gap-2 font-bold text-[9px] md:text-[10px] h-8 md:h-9 hover:bg-chalk uppercase tracking-widest shrink-0">
                <MessageSquare size={14} className="text-harvest" /> Message
              </Button>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-clay/20 space-y-6 md:space-y-8 shadow-sm">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold text-stone/30 uppercase tracking-wider leading-none">Price per KG</p>
                <p className="text-2xl md:text-3xl font-bold text-forest tracking-tighter leading-none">${product.price_per_kg?.toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-clay/10">
                <button 
                  onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))} 
                  className="w-10 h-10 md:w-12 md:h-12 bg-white text-forest rounded-xl shadow-sm hover:bg-forest hover:text-white transition-all active:scale-95 flex items-center justify-center"
                >
                  <Minus size={18}/>
                </button>
                <div className="flex-1 text-center">
                   <span className="font-bold text-xl md:text-2xl text-forest tabular-nums">{buyAmount} KG</span>
                </div>
                <button 
                  onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))} 
                  className="w-10 h-10 md:w-12 md:h-12 bg-white text-forest rounded-xl shadow-sm hover:bg-forest hover:text-white transition-all active:scale-95 flex items-center justify-center"
                >
                  <Plus size={18}/>
                </button>
              </div>

              <div className="pt-6 flex justify-between items-end border-t border-slate-100">
                <span className="text-stone/40 font-bold text-[10px] uppercase tracking-wider leading-none">Total Value</span>
                <span className="text-3xl md:text-4xl font-bold text-forest tracking-tighter leading-none">${(product.price_per_kg * buyAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNegoModalOpen(true)} 
                  disabled={isProcessing || product.stock_kg === 0} 
                  className="h-14 md:h-16 rounded-[1.5rem] md:rounded-3xl border-harvest text-harvest font-bold text-[10px] uppercase tracking-widest hover:bg-harvest/5 active:scale-95 transition-all"
                >
                    <Handshake className="mr-2" size={18} /> Bid & Secure
                </Button>
                <Button 
                  onClick={() => handleProcessPurchase(false)} 
                  disabled={isProcessing || product.stock_kg === 0} 
                  className="h-14 md:h-16 rounded-[1.5rem] md:rounded-3xl bg-forest hover:bg-forest/90 text-white font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-forest/10 active:scale-95 transition-all"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><ShoppingBag className="mr-2" size={18} /> Direct Buy</>}
                </Button>
            </div>
            <p className="text-center text-[10px] text-stone/30 font-semibold uppercase tracking-widest">Stock Available: {product.stock_kg} KG in Node</p>
          </div>
        </div>
      </main>

      {isNegoModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-clay/30 shadow-2xl relative overflow-hidden text-left">
             <div className="absolute -top-10 -right-10 text-forest/5"><Gavel size={150} /></div>
             <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-harvest">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Submit Bid</span>
                  </div>
                  <button onClick={() => setIsNegoModalOpen(false)} className="text-stone/40 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-clay/10">
                      <p className="text-[9px] font-bold text-stone/40 uppercase mb-1 leading-none">Standard Price</p>
                      <p className="font-bold text-forest tracking-tight">${product.price_per_kg} / KG</p>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-stone/40 uppercase tracking-widest ml-1 leading-none">Proposed Bid ($)</label>
                      <input type="number" value={negoPrice} onChange={(e) => setNegoPrice(e.target.value)} className="w-full h-14 px-6 rounded-2xl bg-white border border-clay outline-none font-bold text-forest focus:ring-4 focus:ring-forest/5 transition-all" placeholder="0.00" />
                   </div>
                </div>
                <Button onClick={() => handleProcessPurchase(true)} className="w-full h-14 bg-harvest text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-harvest/20 active:scale-95 transition-all">
                   Execute Bid & Pay
                </Button>
             </div>
          </div>
        </div>
      )}

      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/20 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg animate-in zoom-in duration-300 h-[80vh] md:h-[600px]">
            <button onClick={() => setIsChatOpen(false)} className="absolute -top-10 right-0 md:-top-12 md:right-0 w-10 h-10 bg-white border border-clay/20 rounded-full text-stone flex items-center justify-center shadow-xl active:scale-90 transition-all z-[120]"><X size={20} /></button>
            <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-clay/10 h-full">
               <ChatWindow receiverId={product.seller_id} receiverName={product.profiles?.full_name} transactionId={id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
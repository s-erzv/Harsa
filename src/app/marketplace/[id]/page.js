"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkout, getMarketRates } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import ThemeToggle from '@/components/ThemeToggle'
import { 
  ShieldCheck, ArrowLeft, ShoppingBag, Loader2, 
  Plus, Minus, MessageSquare, X, MapPin, Star,
  Globe, Info, Sparkles, Database, ArrowUpRight
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
  const [rates, setRates] = useState(null)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    const fetchData = async () => {
      try { 
        const [prodRes, rateRes] = await Promise.all([
          supabase.from('products').select('*, profiles(*)').eq('id', id).single(),
          getMarketRates()
        ])
        if (prodRes.error) throw prodRes.error
        setProduct(prodRes.data)
        setRates(rateRes)
      } catch (err) {
        toast.error("Node connection failed")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id, supabase])

  const handleProcessPurchase = async () => {
    if (!product?.profiles?.wallet_address) return toast.error("Invalid seller node")
    if (buyAmount > product.stock_kg) return toast.error("Insufficient supply")
    if (!user) return toast.error("Please login first")

    setIsProcessing(true);
    const toastId = toast.loading("Executing smart contract...");
    
    try {
        const totalEthToPay = (product.price_per_kg * buyAmount).toString();
        const items = [{
            sellerAddress: product.profiles.wallet_address,
            priceInEth: totalEthToPay,
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
            p_total_price: Number(totalEthToPay),
            p_amount_paid: Number(totalEthToPay),
            p_status: 'AWAITING_DELIVERY'
        });

        if (error) throw error;
        toast.success("Transaction verified!", { id: toastId });
        router.push('/dashboard/transaksi');
    } catch (err) {
        toast.error("Execution failed: " + (err.shortMessage || err.message), { id: toastId });
    } finally {
        setIsProcessing(false);
    }
  }

  if (loading || !product) return (
    <div className="h-[100dvh] flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest" size={40} />
    </div>
  )

  const currentPrice = product.price_per_kg * buyAmount;
  const displayValue = rates
    ? currency === 'USD' 
      ? (currentPrice * rates.ethToUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : (currentPrice * rates.ethToIdr).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
    : "Calculating..."; 

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-10">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 md:h-20 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 group text-stone hover:text-harvest transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-xs md:text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Badge variant="outline" className="flex border-harvest/30 text-harvest bg-harvest/5 rounded-full px-2 md:px-3 py-1 gap-1.5">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-harvest animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-bold tracking-widest">Nodes</span>
            </Badge>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          <div className="space-y-6 md:space-y-8">
            <div className="relative aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-card border border-border shadow-2xl group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ShieldCheck size={80} className="text-forest/10 dark:text-harvest/10" />
                </div>
              )}
              <div className="absolute top-4 left-4 md:top-8 md:left-8">
                <Badge className="bg-background/80 backdrop-blur-md text-forest dark:text-harvest border border-border px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-bold shadow-xl text-[10px] md:text-xs">
                  {product.category || 'Premium asset'}
                </Badge>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-card border border-border flex items-start gap-4 md:gap-6 shadow-lg">
              <div className="p-3 md:p-4 bg-forest/5 dark:bg-harvest/10 rounded-xl md:rounded-2xl text-forest dark:text-harvest shrink-0">
                <ShieldCheck size={20} className="md:w-7 md:h-7" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <h4 className="font-bold text-xs md:text-sm tracking-tight">Smart Escrow Protection</h4>
                <p className="text-stone dark:text-stone/60 text-[10px] md:text-xs leading-relaxed">
                  Secured via Harsa Smart Contract. Funds only released upon your confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-10">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight italic">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Badge variant="secondary" className="rounded-lg md:rounded-xl px-2.5 py-1 md:px-3 md:py-1.5 gap-1.5 md:gap-2 border border-border bg-muted/50 text-stone text-[10px] md:text-xs">
                  <MapPin size={12} className="text-harvest" /> {product.profiles?.location?.split(',')[0]}
                </Badge>
                <Badge variant="secondary" className="rounded-lg md:rounded-xl px-2.5 py-1 md:px-3 md:py-1.5 gap-1.5 md:gap-2 border border-border bg-muted/50 text-stone text-[10px] md:text-xs">
                  <Star size={12} className="fill-harvest text-harvest border-none" /> {product.profiles?.reputation_score}% Trust
                </Badge>
                <Badge variant="secondary" className="rounded-lg md:rounded-xl px-2.5 py-1 md:px-3 md:py-1.5 gap-1.5 md:gap-2 border border-border bg-muted/50 text-stone text-[10px] md:text-xs">
                  <Database size={12} className="text-forest dark:text-harvest" /> {product.stock_kg} kg stock
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-card border border-border shadow-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-forest dark:bg-harvest rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-white text-base md:text-xl shadow-lg">
                  {product.profiles?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-[8px] md:text-[10px] font-bold text-stone/40 tracking-widest mb-0.5 md:mb-1">Producer</p>
                  <Link href={`/petani/${product.seller_id}`} className="font-bold text-sm md:text-lg hover:text-harvest transition-colors underline decoration-harvest/30 underline-offset-4 truncate max-w-[120px] md:max-w-none block">
                    {product.profiles?.full_name}
                  </Link>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsChatOpen(true)} className="rounded-xl md:rounded-2xl w-10 h-10 md:w-12 md:h-12 border-border hover:bg-muted shrink-0">
                <MessageSquare size={18} className="text-harvest md:w-5 md:h-5" />
              </Button>
            </div>

            <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-card border-2 border-border shadow-2xl space-y-6 md:space-y-10 relative">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] md:text-[11px] font-bold text-stone/40 tracking-widest mb-1 md:mb-2">Protocol Price</p>
                  <p className="text-2xl md:text-4xl font-bold tracking-tighter">Ξ {product.price_per_kg} <span className="text-[10px] md:text-sm font-semibold opacity-30 italic">/ kg</span></p>
                </div>
                <button 
                  onClick={() => setCurrency(currency === 'USD' ? 'IDR' : 'USD')}
                  className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-harvest hover:text-forest transition-colors bg-harvest/5 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-harvest/20"
                >
                  <Globe size={10} className="md:w-3 md:h-3" /> {currency === 'USD' ? 'IDR' : 'USD'}
                </button>
              </div>

              <div className="bg-muted/50 rounded-2xl md:rounded-3xl p-3 md:p-4 flex items-center justify-between border border-border/50">
                <button 
                  onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-harvest hover:text-white transition-all active:scale-90"
                >
                  <Minus size={18} className="md:w-6 md:h-6" />
                </button>
                <div className="text-center">
                  <p className="text-xl md:text-3xl font-bold tabular-nums italic">{buyAmount} kg</p>
                  <p className="text-[8px] md:text-[10px] font-bold text-stone/40">Amount</p>
                </div>
                <button 
                  onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-harvest hover:text-white transition-all active:scale-90"
                >
                  <Plus size={18} className="md:w-6 md:h-6" />
                </button>
              </div>

              <div className="pt-6 md:pt-8 border-t border-border flex justify-between items-center">
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-[8px] md:text-[10px] font-bold text-stone/40 tracking-widest leading-none">Total Value</p>
                  <p className="text-[10px] md:text-xs font-bold text-harvest italic">{displayValue}</p>
                </div>
                <p className="text-3xl md:text-5xl font-bold tracking-tighter text-forest dark:text-harvest italic">
                  Ξ {(product.price_per_kg * buyAmount).toFixed(4)}
                </p>
              </div>

              <Button 
                onClick={handleProcessPurchase} 
                disabled={isProcessing || product.stock_kg === 0} 
                className="w-full h-16 md:h-20 rounded-2xl md:rounded-[2rem] bg-forest dark:bg-harvest text-white font-bold text-xs md:text-sm tracking-[0.15em] md:tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2 md:gap-3"><ShoppingBag size={18} className="md:w-5 md:h-5"/> Execute Purchase</span>}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-background/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full md:max-w-2xl h-full md:h-[70vh] shadow-2xl rounded-none md:rounded-[3rem] overflow-hidden border-none md:border border-border bg-card flex flex-col">
            <div className="flex md:hidden p-4 border-b border-border items-center justify-between bg-card">
               <span className="font-bold text-sm italic">Chat with {product.profiles?.full_name?.split(' ')[0]}</span>
               <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-stone"
                >
                  <X size={20} />
                </button>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)} 
              className="hidden md:flex absolute top-6 right-6 z-[110] w-12 h-12 bg-background border border-border rounded-2xl items-center justify-center text-stone hover:text-red-500 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
            <div className="flex-1 overflow-hidden">
               <ChatWindow receiverId={product.seller_id} receiverName={product.profiles?.full_name} transactionId={id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
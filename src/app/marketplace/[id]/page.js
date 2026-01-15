"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkout, getMarketRates } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import ThemeToggle from '@/components/ThemeToggle'
import BlockchainActivity from '@/components/BlockchainActivity'
import { 
  ShieldCheck, ArrowLeft, ShoppingBag, Loader2, 
  Plus, Minus, MessageSquare, X, MapPin, Star,
  Globe, Database, ArrowUpRight, Cpu, Zap, Calendar, History,
  Coins,
  Package
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
  const [activities, setActivities] = useState([])
  const [farmLogs, setFarmLogs] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try { 
        const [prodRes, rateRes, logsRes] = await Promise.all([
          supabase.from('products').select('*, profiles(*)').eq('id', id).single(),
          getMarketRates(),
          supabase.from('farm_logs').select('*').eq('product_id', id).order('logged_at', { ascending: false })
        ])

        if (prodRes.error) throw prodRes.error
        setProduct(prodRes.data)
        setRates(rateRes)
        setFarmLogs(logsRes.data || [])

        const { data: actData } = await supabase
          .from('transactions')
          .select(`*, buyer:buyer_id(wallet_address), seller:seller_id(wallet_address)`)
          .eq('product_id', id)
          .order('created_at', { ascending: false })
        
        if (actData) setActivities(actData)
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
      const totalEthValue = (Number(product.price_per_kg) * Number(buyAmount));
      
      const { hash, blockchainIds } = await checkout([{
          sellerAddress: product.profiles.wallet_address,
          priceInEth: totalEthValue.toString(),
          sku: product.id            
      }], false, null);

      const { error } = await supabase.rpc('handle_buy_product', {
          p_transaction_id: crypto.randomUUID(), 
          p_product_id: product.id,
          p_amount_kg: buyAmount,
          p_blockchain_id: parseInt(blockchainIds[0].txId), 
          p_tx_hash: hash,
          p_buyer_id: user.id,
          p_seller_id: product.seller_id,
          p_total_price: totalEthValue,
          p_amount_paid: totalEthValue,
          p_status: 'AWAITING_DELIVERY'
      });

      if (error) throw error;
      toast.success("Transaction verified!", { id: toastId });
      router.push('/dashboard/transaksi');
  } catch (err) {
      console.error("Purchase Error:", err);
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
    <div className="min-h-screen bg-background text-foreground font-raleway pb-20 transition-colors duration-500 overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 md:h-20 flex items-center px-4 md:px-0">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 group text-stone hover:text-harvest transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-xs md:text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Badge variant="outline" className="flex border-harvest/30 text-harvest bg-harvest/5 rounded-full px-2 md:px-3 py-1 gap-1.5">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-harvest animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-bold tracking-widest uppercase">Node Live</span>
            </Badge>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative aspect-square rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-card border border-border shadow-2xl group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted opacity-20">
                  <ShieldCheck size={120} strokeWidth={0.5} />
                </div>
              )}
              <div className="absolute top-6 left-6 md:top-10 md:left-10">
                <Badge className="bg-background/90 backdrop-blur-xl text-forest dark:text-harvest border border-border px-4 py-2 md:px-6 md:py-3 rounded-[1.5rem] font-bold shadow-2xl text-[10px] md:text-xs uppercase tracking-widest italic">
                  {product.category || 'Premium Asset'}
                </Badge>
              </div>
            </div>

            {/* Smart Protocol Info */}
            <div className="p-8 rounded-[2.5rem] bg-card border border-border flex items-start gap-6 shadow-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 relative z-10">
                  <ShieldCheck size={28} />
               </div>
               <div className="space-y-1 relative z-10 text-left">
                  <h4 className="font-bold text-sm tracking-tight uppercase italic text-foreground">Smart Escrow Layer</h4>
                  <p className="text-stone dark:text-stone/50 text-xs leading-relaxed italic">
                    Funds are locked in HarsaEscrow.sol. Release of liquidity only occurs upon cryptographically verified delivery.
                  </p>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-10 md:gap-12 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="space-y-6 text-left">
              <h1 className="text-4xl md:text-7xl font-bold tracking-tighter leading-none italic lowercase text-foreground">{product.name}<span className="text-harvest">.</span></h1>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="rounded-2xl px-4 py-2 gap-2 border border-border bg-muted/30 text-stone/60 text-[10px] font-bold uppercase italic tracking-widest">
                  <MapPin size={12} className="text-harvest" /> {product.profiles?.location?.split(',')[0]}
                </Badge>
                <Badge variant="secondary" className="rounded-2xl px-4 py-2 gap-2 border border-border bg-muted/30 text-stone/60 text-[10px] font-bold uppercase italic tracking-widest">
                  <Star size={12} className="fill-harvest text-harvest border-none" /> {product.profiles?.reputation_score}% Trust
                </Badge>
                <Badge variant="secondary" className="rounded-2xl px-4 py-2 gap-2 border border-border bg-muted/30 text-stone/60 text-[10px] font-bold uppercase italic tracking-widest">
                  <Database size={12} className="text-harvest" /> {product.stock_kg} kg available
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-card border border-border shadow-sm group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-forest dark:bg-harvest text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-xl transition-transform group-hover:rotate-6">
                  {product.profiles?.full_name?.charAt(0)}
                </div>
                <div className="text-left space-y-0.5">
                  <p className="text-[10px] font-bold text-stone/40 tracking-[0.2em] uppercase">Producer Node</p>
                  <Link href={`/petani/${product.seller_id}`} className="font-bold text-lg hover:text-harvest transition-colors italic tracking-tight underline decoration-harvest/30 underline-offset-4">
                    {product.profiles?.full_name}
                  </Link>
                </div>
              </div>
              <Button onClick={() => setIsChatOpen(true)} className="w-14 h-14 rounded-2xl bg-muted border border-border text-stone hover:text-harvest hover:bg-card transition-all active:scale-90 shadow-inner p-0 flex items-center justify-center">
                <MessageSquare size={22} />
              </Button>
            </div>

            <div className="p-10 rounded-[3.5rem] bg-card border-2 border-border shadow-2xl space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3s]"><Coins size={200} /></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="text-left space-y-1">
                  <p className="text-[10px] font-bold text-stone/40 uppercase tracking-[0.4em]">Protocol Price</p>
                  <p className="text-4xl md:text-5xl font-bold tracking-tighter tabular-nums italic text-foreground">Ξ {product.price_per_kg} <span className="text-xs font-bold opacity-30 tracking-widest ml-1">/ KG</span></p>
                </div>
                <button onClick={() => setCurrency(currency === 'USD' ? 'IDR' : 'USD')} className="flex items-center gap-2 text-[10px] font-black text-harvest hover:text-forest transition-all bg-harvest/10 px-4 py-2 rounded-full border border-harvest/20 uppercase tracking-widest italic shadow-sm">
                  <Globe size={12} /> {currency}
                </button>
              </div>

              <div className="bg-muted p-5 rounded-[2.5rem] flex items-center justify-between border border-border relative z-10 shadow-inner">
                <button onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))} className="w-14 h-14 rounded-[1.5rem] bg-card border border-border flex items-center justify-center hover:bg-harvest hover:text-white transition-all active:scale-90 text-foreground"><Minus size={20} /></button>
                <div className="text-center">
                  <p className="text-3xl font-bold tabular-nums italic tracking-tighter text-foreground">{buyAmount} <span className="text-xs opacity-40">kg</span></p>
                </div>
                <button onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))} className="w-14 h-14 rounded-[1.5rem] bg-card border border-border flex items-center justify-center hover:bg-harvest hover:text-white transition-all active:scale-90 text-foreground"><Plus size={20} /></button>
              </div>

              <div className="pt-8 border-t border-border flex justify-between items-end relative z-10">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-bold text-stone/40 tracking-[0.3em] uppercase leading-none">Settlement Estimate</p>
                  <p className="text-sm font-black text-harvest italic tabular-nums">{displayValue}</p>
                </div>
                <p className="text-5xl font-bold tracking-tighter text-forest dark:text-harvest italic tabular-nums">Ξ {(product.price_per_kg * buyAmount).toFixed(6)}</p>
              </div>

              <Button onClick={handleProcessPurchase} disabled={isProcessing || product.stock_kg === 0} className="w-full h-20 rounded-[2.5rem] bg-forest dark:bg-harvest text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all relative z-10 group/btn overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                {isProcessing ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-4"><ShoppingBag size={22}/> Execute Acquisition</span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Traceability Protocol Section (Farm Logs) */}
        <section className="mt-24 text-left">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-4">
              <div className="space-y-2">
                 <div className="inline-flex items-center gap-2 text-harvest bg-harvest/10 px-4 py-1.5 rounded-full border border-harvest/20">
                    <History size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol Evidence</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-bold italic tracking-tighter text-foreground lowercase">Harvest Intelligence<span className="text-harvest">.</span></h2>
                 <p className="text-stone/40 text-sm italic font-medium">Traceability logs from the production node.</p>
              </div>
              <div className="p-4 bg-muted border-2 border-dashed border-border rounded-3xl flex items-center gap-4">
                 <Cpu size={24} className="text-harvest opacity-40 animate-pulse" />
                 <p className="text-[10px] font-bold text-stone/40 leading-tight uppercase tracking-widest italic max-w-[200px]">IoT Synchronization ready for next phase deployment.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farmLogs.length > 0 ? (
                farmLogs.map((log, idx) => (
                  <div key={log.id} className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-125 transition-transform"><Zap size={100} /></div>
                     <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-muted rounded-2xl border border-border text-harvest group-hover:bg-harvest group-hover:text-white transition-colors">
                           <Zap size={20} />
                        </div>
                        <Badge variant="outline" className="rounded-xl border-border px-3 py-1 text-[9px] font-black uppercase tracking-widest italic bg-muted/50">
                           Node Log #{farmLogs.length - idx}
                        </Badge>
                     </div>
                     <div className="space-y-4 relative z-10">
                        <div>
                           <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest mb-1 italic">Timestamp</p>
                           <p className="text-sm font-bold text-foreground italic flex items-center gap-2">
                              <Calendar size={14} className="text-harvest" />
                              {new Date(log.logged_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </p>
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest mb-1 italic">Operation</p>
                           <p className="text-lg font-bold text-foreground italic tracking-tight leading-tight">{log.activity_name}</p>
                        </div>
                        <p className="text-sm text-stone/60 leading-relaxed italic border-l-2 border-border pl-4">
                           {log.description}
                        </p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
                   <Package size={48} strokeWidth={1} className="text-stone/20 mx-auto mb-4" />
                   <p className="text-stone/40 font-bold uppercase tracking-widest text-xs italic italic">No intelligence logs found for this node.</p>
                </div>
              )}
           </div>
        </section>

        <div className="mt-32">
            <BlockchainActivity activities={activities} />
        </div>
      </main>

      {/* Floating Chat Console */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 bg-background/40 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative w-full md:max-w-2xl h-[100dvh] md:h-[70vh] shadow-2xl rounded-none md:rounded-[3.5rem] overflow-hidden border-none md:border-2 md:border-border bg-card flex flex-col scale-in">
            <div className="flex md:hidden p-6 border-b border-border items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-forest dark:bg-harvest text-white rounded-xl flex items-center justify-center font-black">
                      {product.profiles?.full_name?.charAt(0)}
                   </div>
                   <span className="font-bold text-sm italic lowercase">Signal with {product.profiles?.full_name?.split(' ')[0]} node.</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-stone/40 active:scale-90 transition-all"><X size={24} /></button>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hidden md:flex absolute top-8 right-8 z-[110] w-12 h-12 bg-background border border-border rounded-2xl items-center justify-center text-stone/40 hover:text-red-500 transition-all active:scale-90 shadow-xl"><X size={24} /></button>
            <div className="flex-1 overflow-hidden">
                <ChatWindow receiverId={product.seller_id} receiverName={product.profiles?.full_name} transactionId={id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
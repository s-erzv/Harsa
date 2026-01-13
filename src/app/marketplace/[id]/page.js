"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkout, getEthPrice } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import { 
  ShieldCheck, ArrowLeft, ShoppingBag, Loader2, 
  Plus, Minus, MessageSquare, X, MapPin, Star, Activity
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user, supabase } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [farmLogs, setFarmLogs] = useState([])  
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()  
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

        const { data: logsData, error: lError } = await supabase
          .from('farm_logs')
          .select('*')
          .eq('product_id', id)
          .order('logged_at', { ascending: false })

        if (!lError) setFarmLogs(logsData || [])

      } catch (err) {
        console.error("error fetching detail:", err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetail()
  }, [id, supabase])

  const handleProcessPurchase = async () => {
    if (!product || !product.profiles?.wallet_address) return alert("Invalid seller node data");
    if (buyAmount > product.stock_kg) return alert("Insufficient supply in this node");
    if (!user) return alert("Security verification required. Please login.");

    setIsProcessing(true);

    try { 
      const currentEthPriceInUsd = await getEthPrice();
      const totalPriceInUsd = Number(product.price_per_kg * buyAmount);
      
      const totalEthToPay = (totalPriceInUsd / currentEthPriceInUsd).toFixed(10);

      const items = [{
        sellerAddress: product.profiles.wallet_address,
        priceInEth: totalEthToPay,
        sku: product.id            
      }];

      const { hash, blockchainIds } = await checkout(items);
      
      if (!blockchainIds || blockchainIds.length === 0) throw new Error("Failed to retrieve Blockchain ID");
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
        p_amount_paid: Number(totalEthToPay)
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: product.seller_id,
        title: 'New Acquisition Logged',
        message: `${buyAmount} kg of ${product.name} has been secured on-chain.`,
        type: 'INFO'
      });

      alert(`Success! Node Secured.\nPaid: ${totalEthToPay} ETH\nValue: $${totalPriceInUsd.toLocaleString()}`);
      router.push('/dashboard/transaksi');

    } catch (err) {
      console.error("Acquisition Error:", err);
      const msg = err.shortMessage || err.message || "Protocol execution failed";
      alert(msg.includes("insufficient funds") ? "Your wallet doesn't have enough ETH Sepolia." : msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={32} /></div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-raleway pb-20 text-left">
      {/* Compact Header */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-clay/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-stone hover:text-forest transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">Back</span>
          </button>
          <div className="flex items-center gap-2 bg-chalk px-3 py-1 rounded-full border border-clay/30">
            <Activity size={12} className="text-forest animate-pulse" />
            <span className="text-[10px] font-bold text-forest uppercase">Node Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-8 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          
          {/* Left: Product Visual */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-clay/10 shadow-sm group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest/5"><ShieldCheck size={100} strokeWidth={1} /></div>
              )}
              <Badge className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-forest font-bold px-4 py-1.5 rounded-xl border-none shadow-sm text-[10px]">
                {product.category || 'Premium'}
              </Badge>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-clay/20 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-forest/5 rounded-2xl text-forest">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-forest font-bold text-[11px] uppercase tracking-wider">Harsa Escrow Protection</p>
                <p className="text-stone/60 text-xs leading-relaxed italic">Your funds are locked in the smart contract and only released once you verify delivery.</p>
              </div>
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 italic tracking-tight uppercase leading-none">{product.name}</h1>
              <div className="flex items-center gap-4 text-stone/40">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-harvest" />
                  <span className="text-xs font-semibold italic">{product.profiles?.location?.split(',')[0]}</span>
                </div>
                <div className="h-3 w-[1px] bg-clay" />
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="fill-harvest text-harvest" />
                  <span className="text-xs font-bold text-forest">{product.profiles?.reputation_score}% Trust</span>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-clay/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-forest rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-forest/10">
                  {product.profiles?.full_name?.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] font-bold text-stone/30 uppercase tracking-widest leading-none mb-1">Source Node</p>
                  <Link href={`/petani/${product.seller_id}`} className="hover:text-harvest transition-colors font-bold text-forest text-sm italic">{product.profiles?.full_name}</Link>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)} className="rounded-xl border-clay/50 gap-2 font-bold text-[10px] h-9 hover:bg-chalk">
                <MessageSquare size={14} className="text-harvest" /> Message
              </Button>
            </div>

            {/* Price & Quantity Box */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-clay/20 space-y-8 shadow-sm">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold text-stone/30 uppercase tracking-wider leading-none">Price per KG</p>
                <p className="text-3xl font-bold text-forest italic tracking-tighter leading-none">${product.price_per_kg?.toLocaleString()}</p>
              </div>
              
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-clay/10">
                <button onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))} className="w-10 h-10 bg-white text-forest rounded-xl active:scale-90 transition-all flex items-center justify-center shadow-sm"><Minus size={16}/></button>
                <div className="text-center">
                   <span className="font-bold text-lg text-forest tabular-nums">{buyAmount} KG</span>
                </div>
                <button onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))} className="w-10 h-10 bg-white text-forest rounded-xl active:scale-90 transition-all flex items-center justify-center shadow-sm"><Plus size={16}/></button>
              </div>

              <div className="pt-6 flex justify-between items-end border-t border-slate-100">
                <span className="text-stone/40 font-bold text-[10px] uppercase tracking-wider">Total Cost</span>
                <span className="text-4xl font-bold text-forest tracking-tighter italic leading-none">${(product.price_per_kg * buyAmount).toLocaleString()}</span>
              </div>
            </div>

            {/* Primary Action */}
            <Button 
              onClick={handleProcessPurchase} 
              disabled={isProcessing || product.stock_kg === 0} 
              className="w-full h-16 rounded-3xl bg-forest hover:bg-forest/90 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-forest/10 active:scale-95 transition-all disabled:opacity-30"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><ShoppingBag className="mr-3 text-harvest" size={18} /> Secure Acquisition</>}
            </Button>
            
            <p className="text-center text-[10px] text-stone/30 font-semibold italic">Stock Available: {product.stock_kg} KG in Node Inventory</p>
          </div>
        </div>
      </main>

      {/* Chat Component */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/20 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg animate-in zoom-in duration-300">
            <button onClick={() => setIsChatOpen(false)} className="absolute -top-12 right-0 w-10 h-10 bg-white border border-clay/20 rounded-full text-stone flex items-center justify-center shadow-xl active:scale-90 transition-all"><X size={20} /></button>
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-clay/10">
               <ChatWindow receiverId={product.seller_id} receiverName={product.profiles?.full_name} transactionId={id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
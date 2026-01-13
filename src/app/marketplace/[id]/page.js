"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkout, getEthPrice } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import { 
  ShieldCheck, ArrowLeft, ShoppingBag, Loader2, 
  Plus, Minus, MessageSquare, X 
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
      
      // Gunakan 10 desimal saja untuk input awal biar gak kepanjangan
      const totalEthToPay = (totalPriceInUsd / currentEthPriceInUsd).toFixed(10);

      const items = [{
        sellerAddress: product.profiles.wallet_address,
        priceInEth: totalEthToPay,
        sku: product.id            
      }];

      const { hash, blockchainIds } = await checkout(items);
      
      if (!blockchainIds || blockchainIds.length === 0) throw new Error("Failed to retrieve Blockchain ID");
      const bId = blockchainIds[0].txId;

      // Simpan ke DB
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
      // Kasih tau user kalo saldo kurang atau network salah
      const msg = err.shortMessage || err.message || "Protocol execution failed";
      alert(msg.includes("insufficient funds") ? "Your wallet doesn't have enough ETH Sepolia." : msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>
  )

  return (
    <div className="min-h-screen bg-white font-raleway pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-3 p-2.5 bg-chalk rounded-xl transition-all active:scale-95 group">
            <ArrowLeft size={20} className="text-forest group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-forest text-[10px] uppercase tracking-widest">Back to Hub</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start text-left">
          <div className="space-y-8">
            <div className="relative aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 shadow-inner group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest/5 scale-150"><ShieldCheck size={120} strokeWidth={1} /></div>
              )}
            </div>

            <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 flex items-start gap-5">
              <ShieldCheck size={24} className="text-forest mt-1" />
              <div className="space-y-1">
                <p className="text-forest font-bold text-xs uppercase tracking-widest leading-none mb-1">Harsa Security Layer</p>
                <p className="text-stone/60 text-xs leading-relaxed italic">Acquisitions are protected by Arbitrum L2 smart contracts. Node settlement occurs post-delivery verification.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <Badge className="bg-forest text-white border-none font-black px-4 py-1 rounded-full text-[9px] uppercase tracking-[0.2em]">Node Inventory: {product.stock_kg} kg</Badge>
              <h1 className="text-4xl md:text-6xl font-black text-forest uppercase italic tracking-tighter leading-[0.9]">{product.name}</h1>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-8 border-y border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-forest rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-forest/20">{product.profiles?.full_name?.charAt(0)}</div>
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-stone/40 uppercase tracking-widest leading-none mb-1">Verified Node</p>
                    <Link href={`/petani/${product.seller_id}`} className="hover:text-harvest transition-colors font-bold text-forest italic uppercase tracking-tighter">{product.profiles?.full_name}</Link>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsChatOpen(true)} className="w-full sm:w-auto rounded-xl border-slate-200 gap-2 font-bold text-[10px] uppercase tracking-widest h-12 hover:bg-slate-50">
                  <MessageSquare size={16} className="text-harvest" /> Encrypted Chat
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8 shadow-inner">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-stone/40 uppercase tracking-widest leading-none">Unit Price</p>
                <p className="text-3xl font-black text-forest italic tracking-tighter leading-none">${product.price_per_kg?.toLocaleString()}</p>
              </div>
              
              <div className="flex items-center justify-between bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <button onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))} className="w-12 h-12 bg-slate-50 text-forest rounded-xl active:scale-90 transition-all flex items-center justify-center border border-slate-100"><Minus size={18}/></button>
                <div className="text-center">
                   <p className="text-[10px] font-black text-stone/30 uppercase tracking-[0.3em] leading-none mb-1">Quantity</p>
                   <span className="font-black text-xl text-forest tabular-nums">{buyAmount} kg</span>
                </div>
                <button onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))} className="w-12 h-12 bg-slate-50 text-forest rounded-xl active:scale-90 transition-all flex items-center justify-center border border-slate-100"><Plus size={18}/></button>
              </div>

              <div className="pt-6 flex justify-between items-end border-t border-slate-200">
                <span className="text-stone/40 font-black text-[10px] uppercase tracking-[0.2em]">Acquisition Value</span>
                <span className="text-4xl font-black text-forest tracking-tighter italic leading-none">${(product.price_per_kg * buyAmount).toLocaleString()}</span>
              </div>
            </div>

            <Button 
              onClick={handleProcessPurchase} 
              disabled={isProcessing || product.stock_kg === 0} 
              className="w-full h-20 rounded-[2rem] bg-forest hover:bg-forest/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-forest/20 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <><ShoppingBag className="mr-3 text-harvest" size={20} /> Deploy & Lock Acquisition</>}
            </Button>
          </div>
        </div>
      </main>

      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg animate-in zoom-in duration-300">
            <button onClick={() => setIsChatOpen(false)} className="absolute -top-14 right-0 w-10 h-10 bg-white border border-slate-100 rounded-full text-stone flex items-center justify-center shadow-2xl active:scale-90 transition-all"><X size={20} /></button>
            <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-slate-100">
               <ChatWindow receiverId={product.seller_id} receiverName={product.profiles?.full_name} transactionId={id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
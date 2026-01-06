"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { buyProduct } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import { 
  ShieldCheck, ArrowLeft, ShoppingBag, Loader2, 
  Info, CheckCircle2, Plus, Minus, Star, Timer, 
  MessageSquare, X 
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
    if (!product || !product.profiles?.wallet_address) return alert("Invalid seller data")
    if (buyAmount > product.stock_kg) return alert("Insufficient stock")
    if (!user) return alert("Please login first")

    setIsProcessing(true)
    try { 
      const dummyPriceInPol = 0.001 
      const { hash, blockchainId } = await buyProduct(
        product.profiles.wallet_address,  
        product.id,                      
        buyAmount,                       
        dummyPriceInPol                  
      );

      const { error } = await supabase.rpc('handle_buy_product', {
        p_transaction_id: crypto.randomUUID(), 
        p_product_id: product.id,
        p_amount_kg: buyAmount,
        p_blockchain_id: blockchainId.toString(),  
        p_tx_hash: hash,
        p_buyer_id: user.id,
        p_seller_id: product.seller_id,
        p_total_price: Number(product.price_per_kg * buyAmount),
        p_amount_paid: Number(dummyPriceInPol * buyAmount)
      });

      if (error) throw error;
      await supabase.from('notifications').insert({
        user_id: product.seller_id,
        title: 'New Order Received!',
        message: `Someone just bought ${buyAmount} kg of ${product.name}.`,
        type: 'INFO'
      })
      alert("Success! Stock updated")
      router.push('/dashboard/transaksi')
    } catch (err) {
      alert(err.message || "Transaction failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>
  )

  return (
    <div className="min-h-screen bg-white font-raleway pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-3 p-2.5 bg-chalk rounded-xl transition-all">
            <ArrowLeft size={20} className="text-forest" /><span className="font-bold text-forest text-sm">Back</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start text-left">
          <div className="space-y-8">
            <div className="relative aspect-square bg-chalk rounded-[3rem] overflow-hidden border border-stone-50 shadow-sm">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest/10 scale-150"><ShieldCheck size={120} strokeWidth={1} /></div>
              )}
            </div>

            <div className="bg-chalk/50 p-6 md:p-8 rounded-[2.5rem] border border-clay/30 flex items-start gap-5">
              <ShieldCheck size={24} className="text-forest mt-1" />
              <div className="space-y-1">
                <p className="text-forest font-bold text-sm">Harsa Protocol</p>
                <p className="text-stone/60 text-xs leading-relaxed">Funds are safe in smart contract. Farmers withdraw after delivery scan.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <Badge className="bg-forest text-chalk border-none font-bold w-fit">Available {product.stock_kg} kg</Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-forest uppercase italic">{product.name}</h1>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-y border-stone-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-forest rounded-2xl flex items-center justify-center font-bold text-white">{product.profiles?.full_name?.charAt(0)}</div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-stone uppercase">Managed by</p>
                    <Link href={`/petani/${product.seller_id}`} className="hover:underline font-bold text-forest">{product.profiles?.full_name}</Link>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsChatOpen(true)} className="w-full sm:w-auto rounded-xl border-clay gap-2 font-bold text-xs h-11">
                  <MessageSquare size={16} /> Chat Farmer
                </Button>
              </div>
            </div>

            <div className="bg-chalk p-6 rounded-[2.5rem] border border-stone-100 space-y-6">
              <p className="text-3xl font-bold text-forest">Rp {product.price_per_kg?.toLocaleString()}</p>
              <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-clay">
                <button onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))} className="w-12 h-12 bg-chalk rounded-xl active:scale-90"><Minus size={20}/></button>
                <span className="font-bold text-xl">{buyAmount} kg</span>
                <button onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))} className="w-12 h-12 bg-chalk rounded-xl active:scale-90"><Plus size={20}/></button>
              </div>
              <div className="pt-4 flex justify-between items-end border-t border-stone-100 font-bold">
                <span className="text-stone text-xs uppercase">Total</span>
                <span className="text-2xl text-forest">Rp {(product.price_per_kg * buyAmount).toLocaleString()}</span>
              </div>
            </div>

            <Button onClick={handleProcessPurchase} disabled={isProcessing || product.stock_kg === 0} className="w-full h-16 rounded-2xl bg-forest text-white font-bold tracking-widest shadow-xl">
              {isProcessing ? <Loader2 className="animate-spin" /> : <><ShoppingBag className="mr-2" size={20} /> Buy & Lock Funds</>}
            </Button>
          </div>
        </div>
      </main>

      {isChatOpen && (
        isMobile ? (
          <ChatWindow 
            receiverId={product.seller_id} 
            receiverName={product.profiles?.full_name} 
            isMobileDrawer={true}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        ) : (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg animate-in zoom-in">
              <button onClick={() => setIsChatOpen(false)} className="absolute -top-12 right-0 p-2 bg-white rounded-full text-stone hover:text-red-500 transition-all"><X size={20} /></button>
              <ChatWindow receiverId={product.seller_id} receiverName={product.profiles?.full_name} />
            </div>
          </div>
        )
      )}
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { buyProduct } from '@/utils/blockchain'
import { 
  ShieldCheck, MapPin, ArrowLeft, 
  ShoppingBag, Truck, Loader2, 
  Info, CheckCircle2, Plus, Minus 
} from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user, supabase } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [farmLogs, setFarmLogs] = useState([])  
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)

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
    if (!product || !product.profiles?.wallet_address) {
      return alert("data penjual atau wallet tidak valid")
    }

    if (buyAmount > product.stock_kg) {
      return alert("stok tidak mencukupi")
    }

    if (!user) return alert("silakan login terlebih dahulu")

    setIsProcessing(true)
    try { 
      const dummyPriceInPol = 0.001 
      
      const { hash, blockchainId } = await buyProduct(
        product.profiles.wallet_address,
        product.id,
        buyAmount,
        dummyPriceInPol
      )

      const { error } = await supabase.rpc('handle_buy_product', {
        p_transaction_id: crypto.randomUUID(), 
        p_product_id: product.id,
        p_amount_kg: buyAmount,
        p_blockchain_id: blockchainId,
        p_tx_hash: hash,
        p_buyer_id: user.id,
        p_seller_id: product.seller_id,
        p_total_price: product.price_per_kg * buyAmount,
        p_amount_paid: 0.01 * buyAmount 
      })
 
      await supabase.from('notifications').insert({
        user_id: product.seller_id,
        title: 'pesanan baru!',
        message: `seseorang baru saja membeli ${buyAmount} kg ${product.name}. segera siapkan logistik!`,
        type: 'INFO'
      })

      if (error) throw error

      alert("sukses! dana dikunci dan stok telah diperbarui")
      router.push('/dashboard/transaksi')

    } catch (err) {
      console.error("blockchain error:", err)
      alert(err.message || "transaksi gagal")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-emerald-800" size={32} />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">menyiapkan hasil bumi...</p>
    </div>
  )

  if (!product) return <div className="p-20 text-center font-bold">produk tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-white font-raleway pb-20">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <span className="font-black text-slate-900 italic tracking-tight">detail produk</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-16 mt-10"> 
        <div className="space-y-12">
          <div className="space-y-8">
            <div className="aspect-square bg-emerald-50 rounded-[4rem] border border-emerald-100 flex items-center justify-center relative overflow-hidden group shadow-inner">
              <ShoppingBag size={140} strokeWidth={0.5} className="text-emerald-200 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-8 left-8">
                <span className="bg-emerald-800 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20">
                  {product.category}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex items-start gap-5 shadow-sm">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                 <ShieldCheck size={24} className="text-emerald-800" />
              </div>
              <div>
                <p className="text-slate-900 font-black text-sm mb-1 uppercase tracking-tight">protokol harsa</p>
                <p className="text-slate-400 text-xs leading-relaxed font-medium text-justify">dana anda aman di smart contract polygon. petani hanya bisa mencairkan dana setelah anda melakukan scan qr saat barang diterima.</p>
              </div>
            </div>
          </div>
 
          <div className="space-y-8 mt-4">
            <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Riwayat Budidaya</h3>
            <div className="relative pl-8 border-l-2 border-slate-100 space-y-10">
              {farmLogs.length > 0 ? (
                farmLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-4 border-emerald-800 shadow-sm" />
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-md transition-all">
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2">
                        {new Date(log.logged_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                      </p>
                      <h4 className="text-sm font-black text-slate-800 italic mb-1">{log.activity_name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">"{log.description}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Belum ada catatan budidaya.</p>
              )}
            </div>
          </div>
        </div>
 
        <div className="flex flex-col pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">tersedia {product.stock_kg} kg</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-50">
            <div className="w-12 h-12 bg-emerald-800 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-emerald-900/20">
              {product.profiles?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">dikelola oleh</p>
              <p className="text-sm font-bold text-slate-800 leading-none">{product.profiles?.full_name}</p>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">atur jumlah pembelian</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-slate-50 p-2 rounded-3xl border border-slate-100">
                <button 
                  onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-600 hover:text-emerald-800 transition active:scale-90"
                >
                  <Minus size={20} />
                </button>
                <input 
                  type="number" 
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(Math.min(product.stock_kg, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 bg-transparent text-center font-black text-xl text-slate-800 focus:outline-none"
                />
                <button 
                  onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-600 hover:text-emerald-800 transition active:scale-90"
                >
                  <Plus size={20} />
                </button>
              </div>
              <p className="text-xs font-bold text-slate-400">total: <span className="text-slate-800 font-black">rp {(product.price_per_kg * buyAmount).toLocaleString()}</span></p>
            </div>
          </div>

          <button 
            onClick={handleProcessPurchase}
            disabled={isProcessing || product.stock_kg === 0}
            className={`
              w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4
              ${isProcessing || product.stock_kg === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-800 text-white shadow-2xl shadow-emerald-900/20 hover:bg-emerald-900 active:scale-95'
              }
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>memproses blockchain...</span>
              </>
            ) : product.stock_kg === 0 ? (
              <span>stok habis</span>
            ) : (
              <>
                <Truck size={20} /> 
                <span>beli & kunci dana</span>
              </>
            )}
          </button>
          
          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed flex items-center gap-4">
            <Info size={18} className="text-slate-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose text-justify">pengiriman via logistik harsa estimasi h+2 setelah konfirmasi petani</p>
          </div>
        </div>
      </main>
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { buyProduct } from '@/utils/blockchain'
import { 
  ShieldCheck, MapPin, ArrowLeft, 
  ShoppingBag, Truck, Loader2, 
  Info, CheckCircle2, Plus, Minus,
  Star, Timer, Package, ChevronRight,
  Languages
} from 'lucide-react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user, supabase } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [farmLogs, setFarmLogs] = useState([])  
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)
  const [lang, setLang] = useState('id')

  const t = {
    id: {
      back: "Kembali",
      protokol: "Protokol Harsa",
      protokol_desc: "Dana anda aman di smart contract Polygon. Petani hanya bisa mencairkan dana setelah anda melakukan scan QR saat barang diterima.",
      riwayat: "Riwayat Budidaya",
      no_logs: "Belum ada catatan budidaya.",
      tersedia: "Tersedia",
      dikelola: "Dikelola oleh",
      atur_jumlah: "Atur jumlah pembelian",
      total: "Total Estimasi",
      beli_btn: "Beli & Kunci Dana",
      stok_habis: "Stok Habis",
      proses: "Memproses Blockchain...",
      info_kirim: "Pengiriman via logistik Harsa estimasi H+2 setelah konfirmasi petani.",
      satuan: "kg"
    },
    en: {
      back: "Back",
      protokol: "Harsa Protocol",
      protokol_desc: "Your funds are safe in Polygon smart contract. Farmers can only withdraw funds after you scan the QR code upon delivery.",
      riwayat: "Cultivation Logs",
      no_logs: "No cultivation logs yet.",
      tersedia: "Available",
      dikelola: "Managed by",
      atur_jumlah: "Set purchase amount",
      total: "Estimated Total",
      beli_btn: "Buy & Lock Funds",
      stok_habis: "Out of Stock",
      proses: "Processing Blockchain...",
      info_kirim: "Shipping via Harsa logistics estimated H+2 after farmer confirmation.",
      satuan: "kg"
    }
  }

  const content = lang === 'id' ? t.id : t.en

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
    if (!product || !product.profiles?.wallet_address) return alert("Data penjual tidak valid")
    if (buyAmount > product.stock_kg) return alert("Stok tidak mencukupi")
    if (!user) return alert("Silakan login terlebih dahulu")

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
        title: 'Pesanan Baru!',
        message: `Seseorang baru saja membeli ${buyAmount} kg ${product.name}. Segera siapkan logistik!`,
        type: 'INFO'
      })

      if (error) throw error
      alert("Sukses! Dana dikunci dan stok telah diperbarui")
      router.push('/dashboard/transaksi')
    } catch (err) {
      alert(err.message || "Transaksi gagal")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="text-stone font-bold text-xs uppercase tracking-[0.2em]">Memuat Produk...</p>
    </div>
  )

  if (!product) return <div className="p-20 text-center font-bold text-forest">Produk tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-white font-raleway pb-32">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2.5 bg-chalk hover:bg-clay/20 rounded-xl transition-all">
              <ArrowLeft size={20} className="text-forest" />
            </button>
            <span className="font-bold text-forest text-sm">{content.back}</span>
          </div>
          <button 
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-chalk border border-clay/50 text-[10px] font-bold text-forest"
          >
            <Languages size={14} /> {lang.toUpperCase()}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start text-left">
          
          <div className="space-y-8">
            <div className="relative aspect-square bg-chalk rounded-[3rem] overflow-hidden border border-stone-50 group shadow-sm">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest/10 scale-150">
                  <ShieldCheck size={120} strokeWidth={1} />
                </div>
              )}
              <Badge className="absolute top-6 left-6 bg-white/90 backdrop-blur text-forest font-bold px-4 py-1.5 rounded-xl border-none shadow-sm">
                {product.category}
              </Badge>
            </div>

            <div className="bg-chalk/50 p-6 md:p-8 rounded-[2.5rem] border border-clay/30 flex items-start gap-5">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-forest shrink-0">
                 <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-forest font-bold text-sm tracking-tight">{content.protokol}</p>
                <p className="text-stone/60 text-xs leading-relaxed font-medium">{content.protokol_desc}</p>
              </div>
            </div>
            
            <div className="hidden lg:block space-y-6 pt-4">
              <h3 className="text-lg font-bold text-forest flex items-center gap-2 italic">
                <Timer size={18} className="text-harvest" /> {content.riwayat}
              </h3>
              <div className="relative pl-6 border-l-2 border-clay space-y-8 ml-2">
                {farmLogs.length > 0 ? (
                  farmLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-forest" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-harvest uppercase tracking-widest">
                          {new Date(log.logged_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <h4 className="text-sm font-bold text-forest">{log.activity_name}</h4>
                        <p className="text-xs text-stone/60 font-medium leading-relaxed italic">"{log.description}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-stone/40 text-xs italic">{content.no_logs}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-8">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Badge className="bg-forest text-chalk border-none font-bold">
                  {content.tersedia} {product.stock_kg} {content.satuan}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-harvest text-harvest" />
                  <span className="text-xs font-bold text-stone">{product.profiles?.reputation_score || 100}</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-forest leading-tight italic tracking-tight uppercase">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 py-6 border-y border-stone-50">
                <div className="w-12 h-12 bg-forest rounded-2xl flex items-center justify-center font-bold text-white shadow-lg">
                  {product.profiles?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone uppercase tracking-widest">{content.dikelola}</p>
                  <Link href={`/petani/${product.seller_id}`} className="hover:underline decoration-harvest">
                    <p className="font-bold text-forest flex items-center gap-1">
                        {product.profiles?.full_name} <CheckCircle2 size={14} className="text-emerald-500" />
                    </p>
                    </Link>
                </div>
              </div>
            </div>

            <div className="bg-chalk p-6 rounded-[2.5rem] border border-stone-100 space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-stone uppercase tracking-widest">Harga per {content.satuan}</span>
                <p className="text-3xl font-bold text-forest tracking-tighter">Rp {product.price_per_kg?.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <p className="text-stone text-[10px] font-bold uppercase tracking-widest">{content.atur_jumlah}</p>
                <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-clay shadow-sm">
                  <button 
                    onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-chalk rounded-xl text-forest hover:bg-forest hover:text-white transition-all active:scale-90"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="font-bold text-xl text-forest tabular-nums">{buyAmount} <span className="text-xs">{content.satuan}</span></span>
                  <button 
                    onClick={() => setBuyAmount(Math.min(product.stock_kg, buyAmount + 1))}
                    className="w-12 h-12 flex items-center justify-center bg-chalk rounded-xl text-forest hover:bg-forest hover:text-white transition-all active:scale-90"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-end border-t border-stone-100">
                <span className="text-stone text-xs font-bold uppercase">{content.total}</span>
                <span className="text-2xl font-bold text-forest tabular-nums italic underline decoration-harvest underline-offset-4 decoration-2">
                  Rp {(product.price_per_kg * buyAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleProcessPurchase}
              disabled={isProcessing || product.stock_kg === 0}
              className={`
                w-full h-16 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all shadow-xl
                ${isProcessing || product.stock_kg === 0
                  ? 'bg-stone-100 text-stone-400' 
                  : 'bg-forest hover:bg-forest/90 text-white shadow-forest/20 active:scale-95'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  {content.proses}
                </>
              ) : product.stock_kg === 0 ? (
                content.stok_habis
              ) : (
                <>
                  <ShoppingBag className="mr-2" size={20} />
                  {content.beli_btn}
                </>
              )}
            </Button>
            
            <div className="lg:hidden space-y-6 pt-4 border-t border-stone-100">
              <h3 className="text-lg font-bold text-forest flex items-center gap-2 italic">
                <Timer size={18} className="text-harvest" /> {content.riwayat}
              </h3>
              <div className="relative pl-6 border-l-2 border-clay space-y-8 ml-2">
                {farmLogs.length > 0 ? (
                  farmLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-forest" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-harvest uppercase tracking-widest">
                          {new Date(log.logged_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <h4 className="text-sm font-bold text-forest">{log.activity_name}</h4>
                        <p className="text-xs text-stone/60 font-medium leading-relaxed italic">"{log.description}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-stone/40 text-xs italic">{content.no_logs}</p>
                )}
              </div>
            </div>

            <div className="p-5 bg-chalk/50 rounded-2xl border border-stone-100 border-dashed flex items-start gap-3">
              <Info size={16} className="text-harvest shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-stone/60 leading-relaxed text-justify">{content.info_kirim}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
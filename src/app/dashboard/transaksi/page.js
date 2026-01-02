"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Truck, ExternalLink, Clock, ShieldCheck,
  QrCode, X, Camera, Loader2, Star,
  MapPin, Info, ShoppingCart, Store, Search, ChevronRight
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getWalletClient, contractAddress } from '@/utils/blockchain'
import abi from '@/utils/escrowAbi.json'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function TransaksiLogistik() {
  const { user, supabase } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [shippingLogs, setShippingLogs] = useState({}) 
  const [loading, setLoading] = useState(true)
  const [activeScanner, setActiveScanner] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [updateModal, setUpdateModal] = useState(null) 
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [comment, setComment] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [existingReviews, setExistingReviews] = useState(new Set())
  const scannerRef = useRef(null)

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  useEffect(() => {
    if (activeScanner) {
      const startScanner = () => {
        const scanner = new Html5QrcodeScanner("reader", { 
          fps: 20, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        })
        scannerRef.current = scanner
        scanner.render((result) => {
          try {
            let scannedId = result.includes('?id=') 
              ? new URL(result).searchParams.get("id") 
              : result.replace('harsa-confirm-', '')
            
            const txData = transactions.find(t => t.id === scannedId)
            if (txData) {
              stopScanner()
              handleConfirmReceipt(txData.id, txData.blockchain_id)
            }
          } catch (e) { console.error(e) }
        }, (err) => {})
      }
      const timeoutId = setTimeout(startScanner, 300)
      return () => { clearTimeout(timeoutId); stopScanner() }
    }
  }, [activeScanner, transactions])

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => { scannerRef.current = null; setActiveScanner(null) })
      .catch(() => { scannerRef.current = null; setActiveScanner(null) })
    } else { setActiveScanner(null) }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const [txRes, revRes] = await Promise.all([
        supabase.from('transactions').select('*, product:products!transactions_product_id_fkey(name, category), seller:profiles!transactions_seller_id_fkey(full_name), buyer:profiles!transactions_buyer_id_fkey(full_name)').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order('created_at', { ascending: false }),
        supabase.from('reviews').select('transaction_id').eq('buyer_id', user.id)
      ])

      if (txRes.error) throw txRes.error
      setTransactions(txRes.data || [])
      setExistingReviews(new Set(revRes.data?.map(r => r.transaction_id)))
      
      if (txRes.data.length > 0) fetchShippingUpdates(txRes.data.map(t => t.id))
    } catch (err) { console.error(err.message) } finally { setLoading(false) }
  }

  const fetchShippingUpdates = async (txIds) => {
    const { data, error } = await supabase.from('shipping_updates').select('*').in('transaction_id', txIds).order('created_at', { ascending: false })
    if (!error) {
      const grouped = data.reduce((acc, log) => {
        if (!acc[log.transaction_id]) acc[log.transaction_id] = []
        acc[log.transaction_id].push(log)
        return acc
      }, {})
      setShippingLogs(grouped)
    }
  }

  const handleStartShipping = async (txId) => {
    try {
      await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', txId)
      await supabase.from('shipping_updates').insert({ transaction_id: txId, location: 'Lokasi Petani', status_description: 'Barang sedang disiapkan untuk pengiriman' })
      fetchTransactions()
      setDetailModal(null)
    } catch (err) { alert(err.message) }
  }

  const handleAddShippingUpdate = async () => {
    try {
      await supabase.from('shipping_updates').insert({ transaction_id: updateModal.id, location: newLocation, status_description: newDesc })
      setUpdateModal(null); setNewLocation(''); setNewDesc(''); fetchTransactions()
    } catch (err) { alert(err.message) }
  }

  const handleConfirmReceipt = async (txId, blockchainId) => {
    try {
      const walletClient = getWalletClient()
      const [account] = await walletClient.getAddresses()
      await walletClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'confirmDelivery',
        args: [BigInt(blockchainId)],
        account,
        gas: 500000n
      })
      await supabase.from('transactions').update({ status: 'COMPLETED' }).eq('id', txId)
      fetchTransactions()
      setDetailModal(null)
      alert("Sukses! Dana telah diteruskan ke petani.")
    } catch (err) { alert("Gagal konfirmasi blockchain.") }
  }

  const submitReview = async () => {
    try {
      await supabase.from('reviews').insert({ transaction_id: ratingModal.id, buyer_id: user.id, seller_id: ratingModal.seller_id, rating: ratingValue, comment: comment })
      setRatingModal(null); setComment(''); fetchTransactions()
    } catch (err) { alert(err.message) }
  }

  const TransactionCard = ({ tx, isSeller }) => (
    <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden flex flex-col h-full">
      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start mb-3">
          <Badge className={`text-[9px] font-bold px-3 py-1 rounded-full border-none ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
            {tx.status === 'COMPLETED' ? 'Selesai' : tx.status === 'SHIPPED' ? 'Dikirim' : 'Proses'}
          </Badge>
          <span className="text-[10px] font-bold text-slate-400">{new Date(tx.created_at).toLocaleDateString('id-ID')}</span>
        </div>
        <CardTitle className="text-lg font-bold text-forest line-clamp-1">{tx.product?.name}</CardTitle>
        <CardDescription className="text-stone text-[11px] font-medium mt-1 truncate">
          {isSeller ? `Pembeli: ${tx.buyer?.full_name}` : `Penjual: ${tx.seller?.full_name}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4 flex-1">
        <div className="flex justify-between items-center py-3 border-y border-slate-50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Package size={14} className="text-harvest" /> {tx.amount_kg} kg
          </div>
          <p className="text-sm font-bold text-forest">Rp {tx.total_price?.toLocaleString('id-ID')}</p>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 bg-slate-50/50">
        <Button onClick={() => setDetailModal({ ...tx, isSeller })} className="w-full bg-white border border-slate-200 text-forest hover:bg-forest hover:text-white rounded-xl font-bold text-xs h-10 gap-2">
          Cek Detail <ChevronRight size={14}/>
        </Button>
      </CardFooter>
    </Card>
  )

  const filtered = transactions.filter(tx => (tx.product?.name.toLowerCase().includes(searchTerm.toLowerCase())) && (statusFilter === 'ALL' || tx.status === statusFilter))
  const buyerTx = filtered.filter(t => t.buyer_id === user?.id)
  const sellerTx = filtered.filter(t => t.seller_id === user?.id)

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pb-32 min-h-screen font-raleway bg-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-forest tracking-tight leading-none">Logistik Harsa</h1>
        <p className="text-stone text-sm mt-2">Manajemen transaksi hasil bumi aman berbasis blockchain.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/40" size={18} />
          <input type="text" placeholder="Cari transaksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 h-12 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-forest/5 outline-none text-sm transition-all" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['ALL', 'AWAITING_DELIVERY', 'SHIPPED', 'COMPLETED'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-6 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${statusFilter === f ? 'bg-forest text-white border-forest shadow-md' : 'bg-white text-stone border-slate-100'}`}>
              {f === 'ALL' ? 'Semua' : f === 'AWAITING_DELIVERY' ? 'Proses' : f === 'SHIPPED' ? 'Dikirim' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="pembelian" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-10 bg-slate-100 p-1.5 rounded-[2rem] max-w-md mx-auto h-auto">
          <TabsTrigger value="pembelian" className="rounded-[1.5rem] data-[state=active]:bg-forest data-[state=active]:text-white py-3 text-xs font-bold transition-all"><ShoppingCart size={16} className="mr-2" /> Pesanan Saya</TabsTrigger>
          <TabsTrigger value="penjualan" className="rounded-[1.5rem] data-[state=active]:bg-forest data-[state=active]:text-white py-3 text-xs font-bold transition-all"><Store size={16} className="mr-2" /> Penjualan Saya</TabsTrigger>
        </TabsList>

        <TabsContent value="pembelian"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{buyerTx.map(tx => <TransactionCard key={tx.id} tx={tx} isSeller={false} />)}</div></TabsContent>
        <TabsContent value="penjualan"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{sellerTx.map(tx => <TransactionCard key={tx.id} tx={tx} isSeller={true} />)}</div></TabsContent>
      </Tabs>

      {detailModal && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-forest/40 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-forest leading-none">{detailModal.product?.name}</h2>
                  <p className="text-stone text-xs mt-2 uppercase font-bold tracking-widest">{detailModal.isSeller ? 'Penjualan' : 'Pembelian'} • {detailModal.id.slice(0,8)}</p>
                </div>
                <button onClick={() => setDetailModal(null)} className="p-2 bg-slate-100 rounded-full text-stone"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Kuantitas</p><p className="font-bold text-forest">{detailModal.amount_kg} kg</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Harga</p><p className="font-bold text-forest">Rp {detailModal.total_price.toLocaleString()}</p></div>
                <div className="col-span-2 pt-2 border-t border-slate-200"><p className="text-[10px] font-bold text-slate-400 uppercase">{detailModal.isSeller ? 'Pembeli' : 'Penjual'}</p><p className="font-bold text-forest">{detailModal.isSeller ? detailModal.buyer?.full_name : detailModal.seller?.full_name}</p></div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Pengiriman</h4>
                <div className="relative pl-6 border-l-2 border-emerald-100 space-y-6">
                  {shippingLogs[detailModal.id]?.map((log, i) => (
                    <div key={log.id} className="relative">
                      <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-white ${i === 0 ? 'bg-forest scale-110 shadow-lg' : 'bg-slate-300'}`} />
                      <p className={`text-sm ${i === 0 ? 'font-bold text-forest' : 'text-slate-500 font-medium'}`}>{log.status_description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{log.location} • {new Date(log.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                  {(!shippingLogs[detailModal.id] || shippingLogs[detailModal.id].length === 0) && <p className="text-xs italic text-stone">Belum ada pembaruan logistik.</p>}
                </div>
              </div>

              {detailModal.status === 'SHIPPED' && detailModal.isSeller && (
                <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl">
                  <p className="text-xs font-bold text-forest uppercase tracking-widest">Scan QR Konfirmasi</p>
                  <QRCodeSVG value={`${window.location.origin}/dashboard/transaksi?id=${detailModal.id}`} size={180} level="H" includeMargin={true} className="rounded-2xl shadow-xl bg-white p-2" />
                  <p className="text-[10px] text-slate-400 text-center italic">Tunjukkan kode ini kepada pembeli saat menyerahkan barang.</p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                {detailModal.status === 'AWAITING_DELIVERY' && detailModal.isSeller && <Button onClick={() => handleStartShipping(detailModal.id)} className="w-full bg-forest h-14 rounded-2xl font-bold">Mulai Pengiriman</Button>}
                {detailModal.status === 'SHIPPED' && !detailModal.isSeller && <Button onClick={() => { setDetailModal(null); setActiveScanner(detailModal.id); }} className="w-full bg-forest h-14 rounded-2xl font-bold gap-2"><Camera size={20}/> Scan Terima Barang</Button>}
                {detailModal.status === 'SHIPPED' && detailModal.isSeller && <Button onClick={() => setUpdateModal(detailModal)} className="w-full bg-white border-2 border-forest text-forest h-14 rounded-2xl font-bold">Perbarui Lokasi Paket</Button>}
                {detailModal.status === 'COMPLETED' && !detailModal.isSeller && !existingReviews.has(detailModal.id) && <Button onClick={() => setRatingModal(detailModal)} className="w-full bg-forest h-14 rounded-2xl font-bold">Beri Ulasan Produk</Button>}
                <a href={`https://amoy.polygonscan.com/tx/${detailModal.tx_hash}`} target="_blank" className="text-[11px] text-center text-slate-400 hover:text-forest font-bold uppercase py-2">Lihat Bukti Digital Blockchain <ExternalLink size={12} className="inline ml-1" /></a>
              </div>
            </div>
          </div>
        </div>
      )}

      {updateModal && (
        <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 bg-forest/40 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h2 className="text-xl font-bold text-forest mb-6">Pembaruan Lokasi</h2>
            <div className="space-y-4 mb-8">
              <input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium" placeholder="Lokasi (Contoh: Gudang Bandung)" value={newLocation} onChange={e => setNewLocation(e.target.value)} />
              <textarea className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none h-28 text-sm font-medium" placeholder="Keterangan singkat pengiriman..." value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
            <div className="flex gap-3"><Button variant="ghost" className="flex-1 rounded-xl font-bold" onClick={() => setUpdateModal(null)}>Batal</Button><Button className="flex-1 bg-forest text-white rounded-xl font-bold shadow-lg" onClick={handleAddShippingUpdate}>Simpan</Button></div>
          </div>
        </div>
      )}

      {activeScanner && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-forest/90 backdrop-blur-lg">
          <div className="relative bg-white w-full max-w-md p-6 h-full md:h-auto md:rounded-[2.5rem] flex flex-col justify-center">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-forest">Konfirmasi Terima</h2><button onClick={stopScanner} className="p-2 bg-slate-100 rounded-full text-stone"><X size={20}/></button></div>
            <div id="reader" className="overflow-hidden rounded-3xl mb-6 shadow-inner border-4 border-slate-50" />
            <div className="bg-slate-50 p-4 rounded-2xl flex gap-3 italic text-xs text-stone font-medium leading-relaxed"><Info size={20} className="shrink-0 text-forest" /> Arahkan kamera ke Kode QR Penjual untuk mencairkan dana escrow secara aman melalui smart contract blockchain.</div>
          </div>
        </div>
      )}

      {ratingModal && (
        <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 bg-forest/40 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h2 className="text-xl font-bold text-forest mb-2">Beri Ulasan</h2>
            <p className="text-xs text-stone mb-8 italic">Bagaimana kualitas hasil bumi yang Anda terima?</p>
            <div className="flex justify-center gap-3 mb-10">{[1, 2, 3, 4, 5].map(s => (<button key={s} onClick={() => setRatingValue(s)} className="transition-transform active:scale-90"><Star size={44} className={`${s <= ratingValue ? 'fill-harvest text-harvest' : 'text-slate-100'}`} /></button>))}</div>
            <textarea className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none h-28 mb-6 text-sm font-medium" placeholder="Tuliskan pengalaman Anda..." value={comment} onChange={e => setComment(e.target.value)} />
            <Button className="w-full bg-forest h-14 rounded-2xl font-bold shadow-xl" onClick={submitReview}>Kirim Ulasan</Button>
          </div>
        </div>
      )}
    </div>
  )
}
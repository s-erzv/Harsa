"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  Package, Truck, CheckCircle2, 
  ExternalLink, Clock, ShieldCheck,
  QrCode, X, Camera, Loader2, Star
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getWalletClient, contractAddress } from '@/utils/blockchain'
import abi from '@/utils/escrowAbi.json'

export default function TransaksiLogistik() {
  const { user, supabase } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeScanner, setActiveScanner] = useState(null)
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [comment, setComment] = useState('')
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
            let scannedId = ""
            if (result.includes('?id=')) {
              const url = new URL(result)
              scannedId = url.searchParams.get("id")
            } else if (result.includes('harsa-confirm-')) {
              scannedId = result.replace('harsa-confirm-', '')
            } else {
              scannedId = result
            }

            const txData = transactions.find(t => t.id === scannedId)
            
            if (txData) {
              stopScanner()
              handleConfirmReceipt(txData.id, txData.blockchain_id)
            }
          } catch (e) {
            console.error("error parsing qr:", e)
          }
        }, (err) => {})
      }

      const timeoutId = setTimeout(startScanner, 300)
      return () => {
        clearTimeout(timeoutId)
        stopScanner()
      }
    }
  }, [activeScanner, transactions])

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        scannerRef.current = null
        setActiveScanner(null)
      }).catch(err => {
        scannerRef.current = null
        setActiveScanner(null)
      })
    } else {
      setActiveScanner(null)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          product:products!transactions_product_id_fkey (name, category),
          seller:profiles!transactions_seller_id_fkey (full_name),
          buyer:profiles!transactions_buyer_id_fkey (full_name)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartShipping = async (txId) => {
    try {
      const { error } = await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', txId)
      if (error) throw error
      fetchTransactions()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleConfirmReceipt = async (txId, blockchainId) => {
    try {
      const walletClient = getWalletClient()
      if (!walletClient) return alert("dompet tidak terdeteksi")
      
      const [account] = await walletClient.getAddresses()
      const cleanId = BigInt(blockchainId) 

      await walletClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'confirmDelivery',
        args: [cleanId],
        account,
        gas: 500000n
      })

      alert("transaksi diproses di blockchain...")

      const { error } = await supabase
        .from('transactions')
        .update({ status: 'COMPLETED' })
        .eq('id', txId)

      if (error) throw error
      
      alert("sukses! dana dicairkan")
      fetchTransactions()
    } catch (err) {
      console.error("blockchain error:", err)
      alert("gagal cairkan dana: pastikan saldo cukup dan id transaksi benar")
    }
  }

  const submitReview = async () => {
    try {
      const { error } = await supabase.from('reviews').insert({
        transaction_id: ratingModal.id,
        buyer_id: user.id,
        seller_id: ratingModal.seller_id,
        rating: ratingValue,
        comment: comment
      })
      
      if (error) throw error
      alert("ulasan berhasil dikirim")
      setRatingModal(null)
      setComment('')
      fetchTransactions()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 font-raleway pb-32">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">logistik harsa</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">manajemen rantai pasok</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-800" size={32}/></div>
      ) : (
        <div className="grid gap-6">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 justify-between items-center">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${
                      tx.status === 'AWAITING_DELIVERY' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      tx.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {tx.status.replace('_', ' ')}
                    </span>
                    <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12}/> {new Date(tx.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{tx.product?.name}</h3>
                  <div className="flex gap-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-slate-600 flex items-center gap-2 tracking-widest uppercase">
                      <Package size={14} className="text-emerald-800"/> {tx.amount_kg} kg
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-slate-600 flex items-center gap-2 tracking-widest uppercase">
                      <ShieldCheck size={14} className="text-emerald-800"/> rp {tx.total_price?.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs font-medium italic">
                    {user.id === tx.seller_id ? `pembeli: ${tx.buyer?.full_name}` : `penjual: ${tx.seller?.full_name}`}
                  </p>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
                  <a href={`https://amoy.polygonscan.com/tx/${tx.tx_hash}`} target="_blank" className="text-[9px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 hover:underline mb-2">
                    blockchain bukti <ExternalLink size={12} />
                  </a>

                  {tx.status === 'AWAITING_DELIVERY' && user.id === tx.seller_id && (
                    <button onClick={() => handleStartShipping(tx.id)} className="w-full bg-emerald-800 text-white px-8 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition">
                      konfirmasi kirim
                    </button>
                  )}

                  {tx.status === 'SHIPPED' && user.id === tx.seller_id && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-inner">
                        <QRCodeSVG value={`${window.location.origin}/dashboard/transaksi?id=${tx.id}`} size={120} />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">tunjukkan qr</p>
                    </div>
                  )}

                  {tx.status === 'SHIPPED' && user.id === tx.buyer_id && (
                    <button onClick={() => setActiveScanner(tx.id)} className="w-full bg-blue-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition">
                      <Camera size={18} /> scan terima
                    </button>
                  )}
                  
                  {tx.status === 'COMPLETED' && (
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100">
                        <CheckCircle2 size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">selesai</span>
                      </div>
                      {user.id === tx.buyer_id && (
                        <button onClick={() => setRatingModal(tx)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-800 transition">
                          + beri ulasan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {activeScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={stopScanner} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-900 italic tracking-tighter">validasi harsa</h2>
              <button onClick={stopScanner} className="p-3 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div id="reader" className="rounded-[2rem] overflow-hidden border-0" />
          </div>
        </div>
      )}
 
      {ratingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setRatingModal(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 italic mb-2">ulasan hasil bumi</h2>
            <p className="text-xs text-slate-400 font-medium mb-8">bagaimana kualitas produk dari petani ini?</p>
            
            <div className="flex gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRatingValue(star)}>
                  <Star size={32} fill={star <= ratingValue ? "#064e3b" : "none"} className={star <= ratingValue ? "text-emerald-800" : "text-slate-200"} />
                </button>
              ))}
            </div>

            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="tulis ulasan singkat..."
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/10 mb-8 h-32 italic"
            />

            <button onClick={submitReview} className="w-full bg-emerald-800 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
              kirim ulasan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
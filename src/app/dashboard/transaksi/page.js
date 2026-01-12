"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Package, Camera, X, Loader2, MessageSquare, Info } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getWalletClient, contractAddress } from '@/utils/blockchain'
import ChatWindow from '@/components/ChatWindow'
import abi from '@/utils/escrowAbi.json'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export default function PesananSaya() {
  const { user, supabase } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeScanner, setActiveScanner] = useState(false)
  const [activeChat, setActiveChat] = useState(null) 
  const [isMobile, setIsMobile] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()  
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { if (user) fetchPurchases() }, [user])

  useEffect(() => {
    if (activeScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 })
      scanner.render(async (result) => {
        const txId = result.includes('?id=') ? new URL(result).searchParams.get("id") : result
        const txData = purchases.find(t => t.id === txId)
        if (txData) {
          scanner.clear()
          setActiveScanner(false)
          handleConfirmReceipt(txData.id, txData.blockchain_id)
        }
      })
      scannerRef.current = scanner
      return () => scanner.clear()
    }
  }, [activeScanner, purchases])

  const fetchPurchases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, product:products(name), seller:profiles!transactions_seller_id_fkey(id, full_name)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setPurchases(data)
    setLoading(false)
  }

  const handleConfirmReceipt = async (txId, blockchainId) => {
    try {
      const walletClient = await getWalletClient()
      const [account] = await walletClient.getAddresses()
      await walletClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'confirmDelivery',
        args: [BigInt(blockchainId)],
        account,
        gas: 500000n
      })
      await supabase.from('transactions').update({ status: 'COMPLETE' }).eq('id', txId)
      alert("Success! Funds forwarded to farmer.")
      fetchPurchases()
    } catch (err) { alert("Confirmation failed: " + err.message) }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-raleway bg-white min-h-screen pb-32 text-left">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-forest">My orders</h1>
        <p className="text-stone text-sm mt-2">Track the delivery status of your purchased produce.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchases.map(tx => (
          <Card key={tx.id} className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardHeader className="p-6 pb-2">
              <Badge className={`w-fit mb-3 border-none font-bold px-3 py-1 rounded-full ${
                tx.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
              }`}>
                {tx.status.replace('_', ' ')}
              </Badge>
              <CardTitle className="text-lg font-bold text-forest line-clamp-1">{tx.product?.name}</CardTitle>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-stone font-medium">Seller: {tx.seller?.full_name}</p>
                <button 
                  onClick={() => setActiveChat(tx)}
                  className="p-2 bg-slate-50 text-forest rounded-xl hover:bg-forest hover:text-white transition-all shadow-sm"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center py-4 border-y border-slate-50 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Package size={14} className="text-harvest" /> {tx.amount_kg} kg
                </div>
                <p className="text-sm font-bold text-forest">Rp {tx.total_price.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex gap-2">
                {tx.status === 'SHIPPED' && (
                  <Button onClick={() => setActiveScanner(true)} className="flex-1 bg-forest hover:bg-forest/90 text-white rounded-2xl font-bold text-xs h-12 gap-2 shadow-xl">
                    <Camera size={16}/> Scan receipt
                  </Button>
                )}
                <Link href={`/dashboard/transaksi/${tx.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-2xl border-slate-200 text-forest font-bold text-xs h-12">Detail</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeChat && (
        isMobile ? (
          <ChatWindow 
            isMobileDrawer={true} 
            isOpen={!!activeChat} 
            onClose={() => setActiveChat(null)} 
            receiverId={activeChat.seller?.id} 
            receiverName={activeChat.seller?.full_name} 
            transactionId={activeChat.id}
          />
        ) : (
          <div className="fixed bottom-6 right-6 w-96 z-[130] animate-in slide-in-from-bottom-5">
            <div className="relative">
              <button 
                onClick={() => setActiveChat(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-red-500 transition-all z-10"
              >
                <X size={14} />
              </button>
              <ChatWindow 
                receiverId={activeChat.seller?.id} 
                receiverName={activeChat.seller?.full_name} 
                transactionId={activeChat.id}
                isMobileDrawer={false} 
              />
            </div>
          </div>
        )
      )}

      {activeScanner && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-forest/90 backdrop-blur-sm p-4 text-center">
          <div className="bg-white w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-forest">Scan QR penjual</h2>
              <Button onClick={() => setActiveScanner(false)} variant="ghost" className="rounded-full w-10 h-10 p-0"><X size={20}/></Button>
            </div>
            <div id="reader" className="rounded-3xl overflow-hidden border-4 border-slate-50 mb-4" />
          </div>
        </div>
      )}
    </div>
  )
}
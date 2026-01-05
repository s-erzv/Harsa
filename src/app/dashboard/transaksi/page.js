"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Package, Camera, X, Loader2, ShoppingCart, Info } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getWalletClient, contractAddress } from '@/utils/blockchain'
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
  const scannerRef = useRef(null)

  useEffect(() => { if (user) fetchPurchases() }, [user])

  // Logic Scanner QR
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
      .select('*, product:products(name), seller:profiles!transactions_seller_id_fkey(full_name)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setPurchases(data)
    setLoading(false)
  }

  const handleConfirmReceipt = async (txId, blockchainId) => {
    try {
      const walletClient = await getWalletClient()
      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'confirmDelivery',
        args: [BigInt(blockchainId)],
        account,
        gas: 500000n
      })
      await supabase.from('transactions').update({ status: 'COMPLETED' }).eq('id', txId)
      alert("Sukses! Dana diteruskan ke petani.")
      fetchPurchases()
    } catch (err) { alert("Gagal konfirmasi: " + err.message) }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-forest" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-raleway bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Pesanan Saya</h1>
        <p className="text-stone text-sm">Pantau status pengiriman hasil bumi yang Anda beli.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchases.map(tx => (
          <Card key={tx.id} className="rounded-[2.5rem] border-slate-100 shadow-sm">
            <CardHeader>
              <Badge className="w-fit mb-2 bg-emerald-50 text-emerald-700 border-none">{tx.status}</Badge>
              <CardTitle className="text-lg text-forest">{tx.product?.name}</CardTitle>
              <p className="text-xs text-stone">Penjual: {tx.seller?.full_name}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between py-4 border-y border-slate-50 mb-4 font-bold">
                <span className="text-xs text-slate-500">{tx.amount_kg} kg</span>
                <span className="text-sm text-forest">Rp {tx.total_price.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                {tx.status === 'SHIPPED' && (
                  <Button onClick={() => setActiveScanner(true)} className="flex-1 bg-forest rounded-xl font-bold text-xs h-10 gap-2">
                    <Camera size={14}/> Scan Terima
                  </Button>
                )}
                <Link href={`/dashboard/transaksi/${tx.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl border-slate-200 text-forest font-bold text-xs h-10">Detail</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeScanner && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-forest/90 p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-[2rem]">
            <div className="flex justify-between mb-4"><h2 className="font-bold">Scan QR Penjual</h2><Button onClick={() => setActiveScanner(false)} variant="ghost"><X/></Button></div>
            <div id="reader" className="rounded-2xl overflow-hidden" />
          </div>
        </div>
      )}
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Package, ChevronRight, Loader2, Store, Truck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export default function PenjualanPage() {
  const { user, supabase } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchSales() }, [user])

  const fetchSales = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, product:products(name), buyer:profiles!transactions_buyer_id_fkey(full_name)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setSales(data)
    setLoading(false)
  }

  const handleUpdateStatus = async (txId) => {
    const { error } = await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', txId)
    if (!error) {
      await supabase.from('shipping_updates').insert({
        transaction_id: txId,
        location: 'Gudang Petani',
        status_description: 'Pesanan telah dikemas dan siap dikirim'
      })
      fetchSales()
      alert("Status diperbarui ke: DIKIRIM")
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-forest" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-raleway bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Penjualan Saya</h1>
        <p className="text-stone text-sm">Kelola pesanan masuk dari pembeli dengan efisien.</p>
      </div>

      <Tabs defaultValue="AWAITING_DELIVERY" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-8 inline-flex h-auto">
          <TabsTrigger value="AWAITING_DELIVERY" className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-forest data-[state=active]:text-white">Perlu Dikirim</TabsTrigger>
          <TabsTrigger value="SHIPPED" className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-forest data-[state=active]:text-white">Dikirim</TabsTrigger>
          <TabsTrigger value="COMPLETED" className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-forest data-[state=active]:text-white">Selesai</TabsTrigger>
        </TabsList>

        {['AWAITING_DELIVERY', 'SHIPPED', 'COMPLETED'].map(status => (
          <TabsContent key={status} value={status}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sales.filter(s => s.status === status).map(tx => (
                <Card key={tx.id} className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                       <Badge className="bg-slate-50 text-slate-600 text-[10px] border-none">{new Date(tx.created_at).toLocaleDateString()}</Badge>
                    </div>
                    <CardTitle className="text-lg text-forest line-clamp-1">{tx.product?.name}</CardTitle>
                    <p className="text-xs text-stone font-medium">Pembeli: {tx.buyer?.full_name}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between py-4 border-y border-slate-50 mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Package size={14} className="text-harvest" /> {tx.amount_kg} kg
                      </div>
                      <span className="text-sm font-bold text-forest">Rp {tx.total_price.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {tx.status === 'AWAITING_DELIVERY' && (
                        <Button onClick={() => handleUpdateStatus(tx.id)} className="flex-1 bg-forest rounded-xl font-bold text-xs h-10 gap-2">
                          <Truck size={14}/> Kirim
                        </Button>
                      )}
                      <Link href={`/dashboard/transaksi/${tx.id}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl border-slate-200 text-forest font-bold text-xs h-10">Detail</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sales.filter(s => s.status === status).length === 0 && (
                <div className="col-span-full py-16 text-center text-stone italic text-sm">Tidak ada transaksi di status ini.</div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Package, Loader2, Truck, MessageSquare, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import ChatWindow from '@/components/ChatWindow'

export default function PenjualanPage() {
  const { user, supabase } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { if (user) fetchSales() }, [user])

  const fetchSales = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, product:products(name), buyer:profiles!transactions_buyer_id_fkey(id, full_name)')
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
        location: 'Farmer Warehouse',
        status_description: 'Order has been packed and is ready for pickup'
      })
      fetchSales()
      alert("Status updated to: SHIPPED")
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-raleway">
      <Loader2 className="animate-spin text-forest" size={40} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-raleway bg-white min-h-screen pb-32">
      <div className="mb-10 text-left">
        <h1 className="text-3xl font-bold text-forest">My Sales</h1>
        <p className="text-stone text-sm mt-2">Manage incoming orders from buyers efficiently.</p>
      </div>

      <Tabs defaultValue="AWAITING_DELIVERY" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-10 inline-flex h-auto">
          <TabsTrigger value="AWAITING_DELIVERY" className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-forest data-[state=active]:text-white">To Ship</TabsTrigger>
          <TabsTrigger value="SHIPPED" className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-forest data-[state=active]:text-white">Shipped</TabsTrigger>
          <TabsTrigger value="COMPLETED" className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-forest data-[state=active]:text-white">Completed</TabsTrigger>
        </TabsList>

        {['AWAITING_DELIVERY', 'SHIPPED', 'COMPLETED'].map(status => (
          <TabsContent key={status} value={status}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sales.filter(s => s.status === status).map(tx => (
                <Card key={tx.id} className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white text-left">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-4">
                       <Badge className="bg-slate-50 text-slate-400 text-[10px] border-none font-bold">
                        {new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                       </Badge>
                       <button 
                        onClick={() => setActiveChat(tx)}
                        className="p-2 bg-chalk text-forest rounded-xl hover:bg-forest hover:text-white transition-all shadow-sm"
                        title="Chat Buyer"
                       >
                        <MessageSquare size={16} />
                       </button>
                    </div>
                    <CardTitle className="text-lg font-bold text-forest line-clamp-1">{tx.product?.name}</CardTitle>
                    <p className="text-xs text-stone font-medium mt-1">Buyer: {tx.buyer?.full_name}</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex justify-between py-4 border-y border-slate-50 mb-6 font-bold">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Package size={14} className="text-harvest" /> {tx.amount_kg} kg
                      </div>
                      <span className="text-sm text-forest">Rp {tx.total_price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex gap-2">
                      {tx.status === 'AWAITING_DELIVERY' && (
                        <Button onClick={() => handleUpdateStatus(tx.id)} className="flex-1 bg-forest hover:bg-forest/90 text-white rounded-2xl font-bold text-xs h-12 gap-2">
                          <Truck size={16}/> Ship Now
                        </Button>
                      )}
                      <Link href={`/dashboard/transaksi/${tx.id}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-2xl border-slate-200 text-forest hover:bg-slate-50 font-bold text-xs h-12">Detail</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sales.filter(s => s.status === status).length === 0 && (
                <div className="col-span-full py-20 text-center text-stone italic text-sm">No transactions in this stage.</div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {activeChat && (
        isMobile ? (
          <ChatWindow 
            receiverId={activeChat.buyer?.id} 
            receiverName={activeChat.buyer?.full_name} 
            transactionId={activeChat.id}
            isMobileDrawer={true}
            isOpen={!!activeChat}
            onClose={() => setActiveChat(null)}
          />
        ) : (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg animate-in zoom-in">
              <button 
                onClick={() => setActiveChat(null)}
                className="absolute -top-12 right-0 p-2 bg-white rounded-full text-stone hover:text-red-500 shadow-lg transition-all"
              >
                <X size={20} />
              </button>
              <ChatWindow 
                receiverId={activeChat.buyer?.id} 
                receiverName={activeChat.buyer?.full_name} 
                transactionId={activeChat.id}
              />
            </div>
          </div>
        )
      )}
    </div>
  )
}
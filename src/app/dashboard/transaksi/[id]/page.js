"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { publicClient, contractAddress } from '@/utils/blockchain'
import abi from '@/utils/escrowAbi.json'
import { ShieldCheck, ArrowLeft, Download, ExternalLink, Package, User, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DetailTransaksiPage() {
  const { id } = useParams()
  const router = useRouter()
  const { supabase } = useAuth()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) fetchDetail() }, [id])

  const fetchDetail = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, product:products(name), seller:profiles!transactions_seller_id_fkey(full_name, wallet_address), buyer:profiles!transactions_buyer_id_fkey(full_name, wallet_address)')
      .eq('id', id).single()
    setTx(data)
    setLoading(false)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.setTextColor(34, 73, 58)  
    doc.text("HARSA OFFICIAL INVOICE", 20, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`ID Transaksi: ${tx.id}`, 20, 30)
    doc.text(`Blockchain ID: ${tx.blockchain_id}`, 20, 35)
    doc.text(`Status: ${tx.status}`, 20, 40)
    doc.text(`Tanggal: ${new Date(tx.created_at).toLocaleString('id-ID')}`, 20, 45)

    autoTable(doc, {
        startY: 55,
        head: [['Produk', 'Kuantitas', 'Total Harga']],
        body: [
        [tx.product?.name, `${tx.amount_kg} kg`, `Rp ${tx.total_price.toLocaleString('id-ID')}`]
        ],
        headStyles: { fillColor: [34, 73, 58], fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 10 },
    })

    const finalY = doc.lastAutoTable.finalY
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text("Bukti Digital Blockchain (Tx Hash):", 20, finalY + 15)
    doc.setFontSize(7)
    doc.text(`${tx.tx_hash}`, 20, finalY + 20)
    doc.setFontSize(8)
    doc.text("Verified by Harsa Smart Contract on Arbitrum/Polygon", 20, finalY + 30)

    doc.save(`Invoice_Harsa_${tx.id.slice(0,5)}.pdf`)
    }

  if (loading || !tx) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white min-h-screen font-raleway">
      <Button variant="ghost" onClick={() => router.back()} className="mb-8 gap-2"><ArrowLeft size={18}/> Kembali</Button>

      <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 mb-8" id="invoice-content">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-bold text-forest mb-2">{tx.product?.name}</h1>
            <p className="text-stone font-bold uppercase tracking-widest text-[10px]">Digital Receipt • {tx.status}</p>
          </div>
          <Button onClick={exportPDF} className="bg-forest rounded-xl gap-2"><Download size={16}/> Export PDF</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-y border-slate-200">
          <div className="space-y-4">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Penjual</p><p className="font-bold text-forest">{tx.seller?.full_name}</p></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Pembeli</p><p className="font-bold text-forest">{tx.buyer?.full_name}</p></div>
          </div>
          <div className="space-y-4">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Blockchain ID</p><p className="font-mono text-forest">{tx.blockchain_id}</p></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Bayar</p><p className="text-2xl font-bold text-forest">Rp {tx.total_price.toLocaleString()}</p></div>
          </div>
        </div>

        <div className="mt-10 p-6 bg-forest rounded-[2rem] text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck size={40} className="text-harvest" />
            <div>
              <p className="font-bold">Verified on Arbitrum/Polygon</p>
              <p className="text-[9px] opacity-70 font-mono truncate max-w-xs">{tx.tx_hash}</p>
            </div>
          </div>
          <a href={`https://amoy.polygonscan.com/tx/${tx.tx_hash}`} target="_blank" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><ExternalLink size={20}/></a>
        </div>
      </div>
    </div>
  )
}
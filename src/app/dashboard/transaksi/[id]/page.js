"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { publicClient, contractAddress } from '@/utils/blockchain'
import abi from '@/utils/escrowAbi.json'
import { ShieldCheck, ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

  const getBase64ImageFromUrl = async (imageUrl) => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), false);
      reader.onerror = () => reject(this);
      reader.readAsDataURL(blob);
    });
  };

  const exportPDF = async () => {
    const doc = new jsPDF()
    const forestGreen = [34, 73, 58]

    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.setFontSize(70);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 150, 150);
    doc.text("VERIFIED", 50, 150, { angle: 45 });
    doc.restoreGraphicsState();

    try {
      const imgData = await getBase64ImageFromUrl('/light.png');
      doc.addImage(imgData, 'PNG', 20, 15, 12, 12);
    } catch (e) { console.error("Logo failed to load"); }

    doc.setFontSize(22);
    doc.setTextColor(34, 73, 58);
    doc.setFont("helvetica", "bold");
    doc.text("Harsa", 35, 23);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Solusi transparansi budidaya & rantai pasok", 35, 28);

    const statusText = tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase();
    doc.setFillColor(34, 73, 58);
    doc.roundedRect(145, 15, 45, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(statusText, 167.5, 21.5, { align: 'center' });

    doc.setTextColor(34, 73, 58);
    doc.setFontSize(14);
    doc.text("Invoice penjualan", 20, 50);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 53, 190, 53);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("ID pesanan:", 20, 63);
    doc.setTextColor(50);
    doc.text(`${tx.id}`, 50, 63);

    doc.setTextColor(100);
    doc.text("Blockchain ID:", 20, 69);
    doc.setTextColor(50);
    doc.text(`${tx.blockchain_id || 'Menunggu'}`, 50, 69);

    doc.setTextColor(100);
    doc.text("Tanggal:", 20, 75);
    doc.setTextColor(50);
    doc.text(`${new Date(tx.created_at).toLocaleString('id-ID')}`, 50, 75);

    autoTable(doc, {
      startY: 120,
      head: [['Deskripsi item', 'Kuantitas', 'Harga satuan', 'Total']],
      body: [
        [
          tx.product?.name, 
          `${tx.amount_kg} kg`, 
          `Rp ${(tx.total_price / tx.amount_kg).toLocaleString('id-ID')}`, 
          `Rp ${tx.total_price.toLocaleString('id-ID')}`
        ]
      ],
      headStyles: { fillColor: forestGreen, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 20, right: 20 }
    })

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(34, 73, 58);
    doc.setFontSize(10);
    doc.text("Verifikasi blockchain", 20, finalY);
    
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text(`Hash: ${tx.tx_hash}`, 20, finalY + 6);

    doc.save(`Invoice_Harsa_${tx.id.slice(0,5)}.pdf`)
  }

  if (loading || !tx) return (
    <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 bg-white min-h-screen font-raleway pb-24">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 p-0 md:p-2 text-stone hover:text-forest">
        <ArrowLeft size={18}/> Kembali
      </Button>

      <div className="bg-slate-50 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-100 mb-8 overflow-hidden relative" id="invoice-content">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-forest mb-2">{tx.product?.name}</h1>
            <Badge className="bg-white text-forest border-forest/20 text-[10px] md:text-xs px-4 py-1 rounded-full font-bold">
              Kuitansi digital • {tx.status.toLowerCase()}
            </Badge>
          </div>
          <Button onClick={exportPDF} className="w-full md:w-auto bg-forest text-white rounded-2xl gap-2 h-12 md:h-14 px-8 shadow-xl shadow-forest/20">
            <Download size={18}/> Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 md:py-10 border-y border-slate-200">
          <div className="space-y-6">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penjual</p><p className="font-bold text-lg text-forest">{tx.seller?.full_name}</p></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pembeli</p><p className="font-bold text-lg text-forest">{tx.buyer?.full_name}</p></div>
          </div>
          <div className="space-y-6">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blockchain ID</p><p className="font-mono font-bold text-forest bg-white px-3 py-1 rounded-lg border border-slate-100 inline-block">#{tx.blockchain_id || '---'}</p></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pembayaran</p><p className="text-3xl font-bold text-forest">Rp {tx.total_price.toLocaleString('id-ID')}</p></div>
          </div>
        </div>

        <div className="mt-10 p-6 md:p-8 bg-forest rounded-[1.5rem] md:rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-500" size={120} />
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="bg-white/10 p-3 md:p-4 rounded-2xl border border-white/20 shrink-0"><ShieldCheck size={32} className="text-harvest" /></div>
            <div className="min-w-0">
              <p className="font-bold text-base md:text-lg leading-none mb-1">Terverifikasi on-chain</p>
              <p className="text-[10px] md:text-xs opacity-60 font-mono truncate max-w-full md:max-w-xs">{tx.tx_hash}</p>
            </div>
          </div>
          <a href={`https://amoy.polygonscan.com/tx/${tx.tx_hash}`} target="_blank" className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
            Lihat hash <ExternalLink size={14}/>
          </a>
        </div>
      </div>
    </div>
  )
}
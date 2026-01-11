"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ShieldCheck, ArrowLeft, Download, ExternalLink, Loader2, Globe, Cpu } from 'lucide-react'
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

  // Conversion Helper
  const toUSDValue = (val) => val / 15600;
  const formatUSD = (val) => toUSDValue(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
    doc.text("Global Agriculture & Supply Chain Transparency", 35, 28);

    const statusText = tx.status.replace('_', ' ');
    doc.setFillColor(34, 73, 58);
    doc.roundedRect(145, 15, 45, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(statusText.toUpperCase(), 167.5, 21.5, { align: 'center' });

    doc.setTextColor(34, 73, 58);
    doc.setFontSize(14);
    doc.text("Sales Invoice", 20, 50);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 53, 190, 53);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Order ID:", 20, 63);
    doc.setTextColor(50);
    doc.text(`${tx.id}`, 50, 63);

    doc.setTextColor(100);
    doc.text("L2 Node ID:", 20, 69);
    doc.setTextColor(50);
    doc.text(`${tx.blockchain_id || 'Pending'}`, 50, 69);

    doc.setTextColor(100);
    doc.text("Timestamp:", 20, 75);
    doc.setTextColor(50);
    doc.text(`${new Date(tx.created_at).toLocaleString('en-US')}`, 50, 75);

    autoTable(doc, {
      startY: 100,
      head: [['Item Description', 'Quantity', 'Unit Price', 'Total']],
      body: [
        [
          tx.product?.name, 
          `${tx.amount_kg} kg`, 
          formatUSD(tx.total_price / tx.amount_kg), 
          formatUSD(tx.total_price)
        ]
      ],
      headStyles: { fillColor: forestGreen, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 20, right: 20 }
    })

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(34, 73, 58);
    doc.setFontSize(10);
    doc.text("Arbitrum On-Chain Verification", 20, finalY);
    
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text(`Hash: ${tx.tx_hash}`, 20, finalY + 6);

    doc.save(`Harsa_Invoice_${tx.id.slice(0,5)}.pdf`)
  }

  if (loading || !tx) return (
    <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 bg-white min-h-screen font-raleway pb-24 text-left">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 p-0 md:p-2 text-stone hover:text-forest transition-all active:scale-95">
        <ArrowLeft size={18}/> Go back
      </Button>

      <div className="bg-slate-50/50 p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 mb-8 overflow-hidden relative shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-forest tracking-tighter italic uppercase mb-3">{tx.product?.name}</h1>
            <Badge className="bg-white text-forest border-clay/30 text-[10px] md:text-xs px-5 py-1.5 rounded-full font-bold uppercase tracking-widest">
              Digital receipt • {tx.status.replace('_', ' ').toLowerCase()}
            </Badge>
          </div>
          <Button onClick={exportPDF} className="w-full md:w-auto bg-forest text-white rounded-[1.5rem] gap-3 h-12 md:h-14 px-8 shadow-xl shadow-forest/20 uppercase text-xs font-bold tracking-widest transition-all active:scale-95">
            <Download size={18}/> Export Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10 md:py-12 border-y border-slate-200/60">
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Merchant</p>
              <p className="font-bold text-xl text-forest italic">{tx.seller?.full_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Buyer</p>
              <p className="font-bold text-xl text-forest italic">{tx.buyer?.full_name}</p>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">L2 Node ID</p>
              <p className="font-mono font-bold text-forest bg-white px-4 py-2 rounded-xl border border-clay/20 inline-block shadow-sm">#{tx.blockchain_id || 'unassigned'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Settlement</p>
              <p className="text-4xl font-bold text-forest tracking-tighter tabular-nums">{formatUSD(tx.total_price)}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-8 md:p-10 bg-forest rounded-[2.5rem] md:rounded-[3.5rem] text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl">
          <Cpu className="absolute -right-6 -bottom-6 text-white/5 group-hover:scale-110 transition-transform duration-700" size={180} />
          <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
            <div className="bg-white/10 p-4 md:p-5 rounded-3xl border border-white/20 shrink-0 backdrop-blur-md">
              <ShieldCheck size={36} className="text-harvest" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg md:text-xl tracking-tight mb-1 italic">Verified on-chain</p>
              <p className="text-[10px] md:text-xs opacity-50 font-mono truncate max-w-full md:max-w-xs">{tx.tx_hash}</p>
            </div>
          </div>
          <a 
            href={`https://arbiscan.io/tx/${tx.tx_hash}`} 
            target="_blank" 
            className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            Arbiscan Node <ExternalLink size={14}/>
          </a>
        </div>
      </div>
      
      <p className="text-[9px] text-stone/40 uppercase font-bold tracking-[0.4em] text-center">
        Secure Protocol Infrastructure &copy; {new Date().getFullYear()} Harsa
      </p>
    </div>
  )
}
"use client"
import React, { useState } from 'react'
import { 
  Sprout, Landmark, HandCoins, ShieldCheck, 
  ArrowRight, QrCode, Percent, Info 
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function LayananFinansial({ profile, lang, content }) {
  return (
    <section className="space-y-6">
      <div className="px-2">
        <h3 className="text-sm font-bold text-forest flex items-center gap-2 tracking-tight uppercase italic">
          <Landmark size={18} className="text-harvest" /> Layanan Digital Harsa
        </h3>
      </div>

      <Tabs defaultValue="pupuk" className="w-full">
        <TabsList className="grid grid-cols-2 bg-chalk p-1 rounded-2xl h-14 border border-clay/30">
          <TabsTrigger value="pupuk" className="rounded-xl font-bold text-xs uppercase tracking-tighter data-[state=active]:bg-forest data-[state=active]:text-white">
            <Sprout size={16} className="mr-2" /> Pupuk Subsidi
          </TabsTrigger>
          <TabsTrigger value="modal" className="rounded-xl font-bold text-xs uppercase tracking-tighter data-[state=active]:bg-forest data-[state=active]:text-white">
            <HandCoins size={16} className="mr-2" /> Modal P2P
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pupuk" className="mt-4 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-bold text-stone uppercase tracking-widest">Kuota Tersedia (Token)</p>
                <h4 className="text-5xl font-bold text-forest italic tabular-nums">
                  {profile?.fertilizer_quota_kg || 0} <span className="text-xl not-italic text-stone/40">kg</span>
                </h4>
                <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={12} /> Terverifikasi RDKK Digital
                </p>
              </div>
              <button className="bg-forest text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-forest/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                <QrCode size={18} /> Tebus di Kios
              </button>
            </div>
            <Sprout size={200} className="absolute -right-20 -bottom-20 text-forest/5 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-700" />
          </div>
        </TabsContent>

        <TabsContent value="modal" className="mt-4 animate-in fade-in duration-500">
          <div className="bg-chalk p-8 rounded-[2.5rem] border border-clay shadow-inner space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-left">
                <h4 className="text-lg font-bold text-forest">Pinjaman Modal Usaha</h4>
                <p className="text-xs text-stone/60 font-medium">Gunakan jaminan hasil panen Anda untuk modal tanam.</p>
              </div>
              <Badge className="bg-harvest text-forest font-black border-none px-4 py-2">Bunga 0.5% / bln</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <LoanFeature 
                 icon={<Percent size={20}/>} 
                 title="Tanpa Agunan Fisik" 
                 desc="Hanya perlu verifikasi blockchain lahan." 
               />
               <LoanFeature 
                 icon={<ArrowRight size={20}/>} 
                 title="Pencairan Kilat" 
                 desc="Dana langsung masuk ke wallet Harsa." 
               />
            </div>

            <button className="w-full bg-forest text-white py-5 rounded-[1.75rem] font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-forest/90 transition-all">
              Ajukan Pinjaman Baru
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-5 bg-clay/10 rounded-2xl border border-stone-100 border-dashed flex items-start gap-3">
        <Info size={16} className="text-harvest shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-stone/60 leading-relaxed text-justify">
          Layanan ini menggunakan infrastruktur Smart Contract Polygon untuk memastikan kuota pupuk tidak bisa diduplikasi dan modal pinjaman aman bagi investor.
        </p>
      </div>
    </section>
  )
}

function LoanFeature({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-clay/30 text-left">
      <div className="p-2.5 bg-chalk rounded-xl text-forest shrink-0">{icon}</div>
      <div>
        <h5 className="text-xs font-bold text-forest mb-1">{title}</h5>
        <p className="text-[10px] text-stone/60 font-medium leading-snug">{desc}</p>
      </div>
    </div>
  )
}
"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, TrendingUp, Handshake, Menu } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900"> 
      <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/light.png" alt="Logo Harsa" width={40} height={40} />
            <span className="text-2xl font-bold tracking-tight text-forest">HARSA</span>
          </div>
          
          <div className="hidden md:flex gap-10 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-forest">Fitur Utama</a>
            <a href="#mekanisme" className="hover:text-forest">Mekanisme</a>
            <a href="#harga" className="hover:text-forest">Harga Pasar</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="bg-forest text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-forest/20 transition">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-forest hidden sm:block">Masuk</Link>
                <Link href="/register" className="bg-forest text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-forest/20 transition">
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
 
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block py-1 px-4 rounded-full bg-forest/5 text-forest text-xs font-bold mb-6 tracking-widest uppercase">
            Teknologi Masa Depan Pertanian
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-[1.1]">
            Keadilan Ekonomi untuk <br /> <span className="text-forest">Petani Indonesia.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            Harsa hadir untuk memastikan setiap butir hasil panen Bapak dan Ibu mendapatkan harga terbaik melalui sistem pasar terdesentralisasi yang transparan dan aman.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="bg-forest text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-forest/90 transition shadow-xl shadow-forest/10">
              Bergabung Sebagai Petani
            </Link>
            <Link href="#mekanisme" className="bg-white border border-slate-200 text-slate-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition">
              Pelajari Sistem
            </Link>
          </div>
        </div>
      </section>
 
      <section id="fitur" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
          <FeatureCard 
            icon={<TrendingUp className="text-forest" size={32} />}
            title="Harga Pasar Real-Time"
            description="Informasi harga komoditas terkini secara nasional untuk meningkatkan daya tawar Bapak dan Ibu."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-forest" size={32} />}
            title="Transaksi Transparan"
            description="Semua akad jual beli dicatat secara permanen, menjamin kepastian pembayaran tanpa potongan siluman."
          />
          <FeatureCard 
            icon={<Handshake className="text-forest" size={32} />}
            title="Langsung ke Pembeli"
            description="Menghubungkan lahan pertanian langsung dengan rantai nilai pangan untuk margin keuntungan lebih besar."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
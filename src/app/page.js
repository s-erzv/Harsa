"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, TrendingUp, Handshake, Menu, X, 
  ArrowRight, Leaf, Globe, Zap, Star,
  Package, ShoppingBag, MapPin, Loader2,
  Database, QrCode, Wallet, CheckCircle2,
  Lock, TrendingDown, Mail, Info, User, Languages
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const { user, supabase } = useAuth();
  const [lang, setLang] = useState('id');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [realData, setRealData] = useState({ products: 0, transactions: 0, prices: [] });
  const [loading, setLoading] = useState(true);

  const t = {
    id: {
      nav: ["Fitur", "Cara Kerja", "Harga", "Ulasan"],
      hero: {
        tag: "Jaringan Tani Digital Lokal",
        title: "Keadilan harga",
        titleAccent: "mulai dari sini.",
        desc: "Harsa hadir sebagai solusi nyata bagi petani lokal. Transaksi aman, harga transparan, dan pembayaran tanpa tunda melalui teknologi blockchain.",
        btn1: "Mulai Belanja",
        btn2: "Pelajari Sistem"
      },
      stats: ["Statistik Real-time Harsa", "Total Panen", "Transaksi", "Update Bursa Lokal"],
      features: {
        tag: "Keunggulan Utama",
        title: "Teknologi untuk kemuliaan tani",
        f1: ["Transparansi Tanpa Batas", "Setiap transaksi dicatat secara permanen dalam blockchain. Tidak ada lagi manipulasi data."],
        f2: ["Rekening Bersama Aman", "Dana pembeli dikunci oleh sistem dan hanya akan diteruskan saat barang dipastikan sampai."],
        f3: ["Analisis Harga Akurat", "Bantu petani mendapatkan info harga pasar yang sebenarnya untuk keputusan jual yang tepat."]
      },
      steps: {
        title: "Bagaimana sistem ini bekerja?",
        desc: "Kami tidak ingin Bapak dan Ibu pusing dengan istilah teknologi. Intinya, Harsa bekerja seperti asisten pribadi.",
        s1: ["Daftarkan Identitas Digital", "Buat akun dan verifikasi identitas. Harsa buatkan kantong digital otomatis."],
        s2: ["Posting Hasil Panen", "Masukkan foto, jenis, stok, dan harga. Produk langsung terlihat di pasar nasional."],
        s3: ["Konfirmasi QR Code", "Cukup tunjukkan QR Code di aplikasi untuk diverifikasi oleh sistem secara otomatis."],
        s4: ["Dana Cair Seketika", "Selesai! Dana masuk ke saldo dan dapat ditarik kapan saja tanpa potongan tersembunyi."]
      },
      market: ["Pantauan Harga Bursa", "Diperbarui langsung dari pasar induk nusantara"],
      reviews: {
        title: "Kata Mitra Tani",
        desc: "Bapak dan Ibu Petani yang telah berani melangkah ke masa depan digital bersama Harsa."
      },
      cta: {
        title: "Majukan Pertanian Nusantara Sekarang.",
        btn1: "Daftar Akun Petani",
        btn2: "Hubungi Kami"
      }
    },
    en: {
      nav: ["Features", "How it Works", "Prices", "Reviews"],
      hero: {
        tag: "Local Digital Farming Network",
        title: "Price justice",
        titleAccent: "starts here.",
        desc: "Harsa is a real solution for local farmers. Secure transactions, transparent pricing, and instant payments through blockchain technology.",
        btn1: "Start Shopping",
        btn2: "Learn More"
      },
      stats: ["Harsa Real-time Statistics", "Total Harvest", "Transactions", "Local Market Updates"],
      features: {
        tag: "Core Advantages",
        title: "Technology for farmers' prosperity",
        f1: ["Absolute Transparency", "Every transaction is permanently recorded on the blockchain. No more data manipulation."],
        f2: ["Secure Escrow", "Buyer funds are locked by the system and only released when goods are confirmed delivered."],
        f3: ["Accurate Price Analytics", "Helping farmers get real market price info for better selling decisions."]
      },
      steps: {
        title: "How does it work?",
        desc: "We don't want you to worry about technical terms. Simply put, Harsa works like a personal assistant.",
        s1: ["Digital Identity Registration", "Create an account and verify your identity. Harsa creates an auto-digital wallet."],
        s2: ["Post Your Harvest", "Input photos, types, stock, and price. Your products are immediately visible nationally."],
        s3: ["QR Code Confirmation", "Just show the QR Code in the app to be verified by the system automatically."],
        s4: ["Instant Fund Release", "Done! Funds enter your balance and can be withdrawn anytime with no hidden fees."]
      },
      market: ["Market Price Monitoring", "Updated directly from national central markets"],
      reviews: {
        title: "Farmer Testimonials",
        desc: "Farmers who have bravely stepped into the digital future with Harsa."
      },
      cta: {
        title: "Advance Local Agriculture Now.",
        btn1: "Register as Farmer",
        btn2: "Contact Us"
      }
    }
  };

  const content = lang === 'id' ? t.id : t.en;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    fetchRealStats();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchRealStats = async () => {
    try {
      const [prodRes, txRes, priceRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('transactions').select('id', { count: 'exact' }),
        supabase.from('market_prices').select('*').limit(3)
      ]);
      setRealData({
        products: prodRes.count || 0,
        transactions: txRes.count || 0,
        prices: priceRes.data || []
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white font-raleway selection:bg-forest selection:text-white overflow-x-hidden">
      <nav className={`fixed w-full z-[100] transition-all duration-500 px-4 ${isScrolled ? 'top-2' : 'top-0'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl py-3 px-5 rounded-3xl shadow-lg border border-clay/20' : 'bg-transparent py-6 px-2'}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/light.png" alt="Logo" width={32} height={32} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-bold tracking-tighter text-forest italic">Harsa</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-8 text-[11px] font-bold text-stone/50 uppercase tracking-widest">
              <a href="#fitur" className="hover:text-forest transition-colors">{content.nav[0]}</a>
              <a href="#mekanisme" className="hover:text-forest transition-colors">{content.nav[1]}</a>
              <a href="#market" className="hover:text-forest transition-colors">{content.nav[2]}</a>
              <a href="#ulasan" className="hover:text-forest transition-colors">{content.nav[3]}</a>
            </div>
            
            <button 
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-chalk border border-clay/50 text-[10px] font-bold text-forest hover:bg-clay/20 transition-all"
            >
              <Languages size={14} /> {lang.toUpperCase()}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="bg-forest text-chalk px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95">Dashboard</Link>
            ) : (
              <Link href="/login" className="bg-forest text-chalk px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95">Login</Link>
            )}
            <button className="md:hidden p-2 text-stone bg-chalk rounded-lg" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
          </div>
        </div>
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-[110] bg-white p-6 animate-in fade-in slide-in-from-right duration-300 flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-2 font-bold text-forest italic">
              <Image src="/light.png" alt="Logo" width={24} height={24} /> Harsa
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="text-xs font-bold text-forest underline">{lang.toUpperCase()}</button>
              <button onClick={() => setMobileMenu(false)} className="p-2 bg-chalk rounded-full"><X size={24} /></button>
            </div>
          </div>
          <div className="flex flex-col gap-6 text-3xl font-bold text-stone-900">
            <a href="#fitur" onClick={() => setMobileMenu(false)}>{content.nav[0]}</a>
            <a href="#mekanisme" onClick={() => setMobileMenu(false)}>{content.nav[1]}</a>
            <a href="#market" onClick={() => setMobileMenu(false)}>{content.nav[2]}</a>
            <Link href="/marketplace" onClick={() => setMobileMenu(false)} className="text-forest">Market</Link>
          </div>
          <div className="mt-auto pb-10">
            <Link href="/register" className="block w-full bg-forest text-white py-5 rounded-2xl text-center font-bold text-lg shadow-xl">Join Now</Link>
          </div>
        </div>
      )}

      <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center text-left">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-clay/20 text-harvest text-[10px] font-bold tracking-widest uppercase border border-clay/30">
                <Globe size={12} /> {content.hero.tag}
              </div>
              <h1 className="text-4xl md:text-7xl font-bold text-stone-900 leading-[1.1] tracking-tight">
                {content.hero.title} <br /> <span className="text-forest italic underline decoration-clay/40 underline-offset-8">{content.hero.titleAccent}</span>
              </h1>
              <p className="text-stone/60 text-base md:text-lg max-w-xl leading-relaxed font-medium">{content.hero.desc}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/marketplace" className="bg-forest text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {content.hero.btn1} <ShoppingBag size={18} />
                </Link>
                <Link href="#mekanisme" className="bg-chalk text-stone px-8 py-4 rounded-2xl font-bold text-sm border border-clay flex items-center justify-center active:scale-95 transition-all">
                  {content.hero.btn2}
                </Link>
              </div>
            </div>

            <div className="relative group mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-forest/5 rounded-[2.5rem] -rotate-2 scale-105 group-hover:rotate-0 transition-transform duration-700" />
              <div className="relative bg-white border border-clay/30 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-chalk pb-4">
                  <p className="text-[10px] font-bold text-stone uppercase tracking-widest">{content.stats[0]}</p>
                  <Zap size={14} fill="currentColor" className="text-harvest animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-chalk/50 p-5 rounded-3xl border border-clay/20 shadow-inner">
                    <p className="text-[9px] font-bold text-stone uppercase mb-1">{content.stats[1]}</p>
                    <p className="text-3xl font-bold text-forest">{realData.products}</p>
                  </div>
                  <div className="bg-chalk/50 p-5 rounded-3xl border border-clay/20 shadow-inner">
                    <p className="text-[9px] font-bold text-stone uppercase mb-1">{content.stats[2]}</p>
                    <p className="text-3xl font-bold text-forest">{realData.transactions}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-stone uppercase px-2">{content.stats[3]}</p>
                  {realData.prices.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-forest text-chalk px-4 py-3 rounded-2xl">
                      <span className="text-xs font-bold">{p.commodity_name}</span>
                      <span className="text-xs font-mono font-bold italic text-harvest">Rp{p.current_price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-16 md:text-center">
            <Badge variant="secondary" className="bg-clay text-forest font-bold mb-4 px-4 py-1.5 rounded-full border-none text-[10px] uppercase tracking-widest">{content.features.tag}</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight">{content.features.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon={<Database className="text-forest" size={32} />} title={content.features.f1[0]} desc={content.features.f1[1]} />
            <FeatureCard icon={<ShieldCheck className="text-forest" size={32} />} title={content.features.f2[0]} desc={content.features.f2[1]} />
            <FeatureCard icon={<TrendingUp className="text-forest" size={32} />} title={content.features.f3[0]} desc={content.features.f3[1]} />
          </div>
        </div>
      </section>

      <section id="mekanisme" className="py-24 bg-chalk/30 border-y border-clay/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 order-2 lg:order-1 text-left">
              <Step num="1" icon={<User className="text-chalk" size={24} />} title={content.steps.s1[0]} desc={content.steps.s1[1]} />
              <Step num="2" icon={<Package className="text-chalk" size={24} />} title={content.steps.s2[0]} desc={content.steps.s2[1]} />
              <Step num="3" icon={<QrCode className="text-chalk" size={24} />} title={content.steps.s3[0]} desc={content.steps.s3[1]} />
              <Step num="4" icon={<CheckCircle2 className="text-chalk" size={24} />} title={content.steps.s4[0]} desc={content.steps.s4[1]} />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-forest text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-left">
                <Leaf className="absolute -right-10 -bottom-10 opacity-10 w-64 h-64" />
                <h2 className="text-4xl font-bold mb-6">{content.steps.title}</h2>
                <p className="text-emerald-100 font-medium leading-relaxed opacity-80 italic text-sm">{content.steps.desc}</p>
                <div className="mt-10 pt-10 border-t border-white/10 flex flex-col gap-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/50">Military Grade Security</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"><ShieldCheck size={14} className="text-emerald-400" /> Blockchain Verification</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"><Lock size={14} className="text-emerald-400" /> Smart Contract Escrow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="market" className="py-24 px-6 bg-white text-left md:text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">{content.market[0]}</h2>
        <p className="text-stone/50 font-medium uppercase text-[10px] tracking-[0.4em] mb-16">{content.market[1]}</p>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {realData.prices.map(item => (
            <div key={item.id} className="bg-white p-10 rounded-[2.5rem] border border-clay/30 shadow-sm hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center">
              <p className="text-[10px] font-black text-stone/40 uppercase mb-3">{item.commodity_name}</p>
              <h4 className="text-4xl font-bold text-forest mb-4 tracking-tighter italic">Rp{item.current_price?.toLocaleString()}</h4>
              <Badge className={item.change_percentage >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}>
                {item.change_percentage >= 0 ? '+' : ''}{item.change_percentage}%
              </Badge>
            </div>
          ))}
        </div>
      </section>

      <section id="ulasan" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-16 text-left">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">{content.reviews.title}</h2>
              <p className="text-stone/60 font-medium">{content.reviews.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <ReviewCard name="Bpk. Suryono" loc="West Bandung" text={lang === 'id' ? "Duit hasil sayur langsung cair pas QR di-scan pembeli." : "Veggie sales income is instantly released when the buyer scans the QR."} />
            <ReviewCard name="Ibu Maryati" loc="Garut" text={lang === 'id' ? "Harsa bantu saya tahu harga pasar asli. Untung naik 30%." : "Harsa helps me know the real market prices. Profits increased by 30%."} />
            <ReviewCard name="Bp. Agus" loc="Sumedang" text={lang === 'id' ? "Jual beras jadi lebih tenang karena dana dijaga blockchain." : "Selling rice is more peaceful now because funds are protected by blockchain."} />
          </div>
        </div>
      </section>

      <footer className="py-24 px-6 bg-forest text-white">
        <div className="max-w-5xl mx-auto text-left md:text-center">
          <h2 className="text-3xl md:text-6xl font-bold mb-10 leading-[1.1]">{content.cta.title}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-start md:justify-center">
            <Link href="/register" className="bg-harvest text-forest px-12 py-5 rounded-2xl font-bold shadow-xl active:scale-95 transition-all text-center">{content.cta.btn1}</Link>
            <Link href="mailto:sarahfajriarahmah@gmail.com" className="bg-white/10 backdrop-blur-md border border-white/20 px-12 py-5 rounded-2xl font-bold hover:bg-white/20 transition-all text-center">{content.cta.btn2}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-clay/30 hover:shadow-2xl transition-all group text-left">
       <div className="w-14 h-14 bg-chalk rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-sm border border-clay/20">{icon}</div>
       <h3 className="text-xl font-bold text-stone-900 mb-4">{title}</h3>
       <p className="text-stone/50 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ num, icon, title, desc }) {
  return (
    <div className="flex gap-6 group text-left">
      <div className="flex-shrink-0 w-12 h-12 bg-forest rounded-2xl flex items-center justify-center shadow-lg relative">
         {icon}
         <span className="absolute -top-2 -left-2 w-6 h-6 bg-harvest text-forest rounded-full border-4 border-white text-[10px] font-black flex items-center justify-center">{num}</span>
      </div>
      <div className="space-y-1">
         <h4 className="text-lg font-bold text-stone-900 leading-tight">{title}</h4>
         <p className="text-stone/50 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ReviewCard({ name, loc, text }) {
  return (
    <div className="bg-chalk/30 p-8 md:p-10 rounded-[3rem] border border-clay/30 relative flex flex-col h-full">
       <div className="flex gap-1 text-harvest mb-6">
          {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
       </div>
       <p className="text-stone/70 font-medium mb-8 italic text-sm leading-relaxed flex-1">"{text}"</p>
       <div className="flex items-center gap-4 pt-6 border-t border-clay/20">
          <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0">{name[0]}</div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">{name}</p>
            <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest">{loc}</p>
          </div>
       </div>
    </div>
  );
}
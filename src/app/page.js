"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, TrendingUp, Menu, X, 
  ArrowRight, Leaf, Globe, Zap,
  Package, ShoppingBag, Loader2,
  Database, QrCode, Wallet, CheckCircle2,
  Lock, MessageSquare, Cpu, Search, User
} from 'lucide-react';

export default function LandingPage() {
  const { user, supabase } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [realData, setRealData] = useState({ products: 0, transactions: 0, prices: [] });
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-white font-raleway selection:bg-forest selection:text-white overflow-x-hidden text-left">
      <nav className={`fixed w-full z-[100] transition-all duration-500 px-4 ${isScrolled ? 'top-2' : 'top-0'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl py-3 px-5 rounded-3xl shadow-lg border border-clay/20' : 'bg-transparent py-6 px-2'}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-forest rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Leaf size={18} className="text-chalk" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tighter text-forest italic leading-none">Harsa</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-stone/50 tracking-widest uppercase">
            <a href="#features" className="hover:text-forest transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-forest transition-colors">Mechanism</a>
            <Link href="/marketplace" className="text-forest flex items-center gap-2">
              <Search size={14} /> Explore Market
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="hidden sm:block bg-forest text-chalk px-6 py-2.5 rounded-2xl text-xs font-bold shadow-xl transition-all active:scale-95">Dashboard</Link>
            ) : (
              <Link href="/login" className="hidden sm:block bg-forest text-chalk px-6 py-2.5 rounded-2xl text-xs font-bold shadow-xl transition-all active:scale-95">Sign in</Link>
            )}
            <button className="md:hidden p-2 text-forest bg-chalk rounded-xl active:scale-90 transition-all" onClick={() => setMobileMenu(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-[110] bg-white p-8 animate-in fade-in slide-in-from-right duration-300 flex flex-col">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2 font-bold text-forest italic text-2xl tracking-tighter">
              <Leaf size={28} /> Harsa
            </div>
            <button onClick={() => setMobileMenu(false)} className="p-3 bg-chalk rounded-2xl active:scale-90 transition-all"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-10 text-4xl font-bold text-stone-900 tracking-tighter italic">
            <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>Mechanism</a>
            <a href="#market" onClick={() => setMobileMenu(false)}>Indices</a>
            <Link href="/marketplace" onClick={() => setMobileMenu(false)} className="text-forest">Marketplace</Link>
          </div>
          <div className="mt-auto space-y-4">
            <Link href={user ? "/dashboard" : "/login"} className="block w-full bg-forest text-white py-5 rounded-[2rem] text-center font-bold text-lg shadow-xl active:scale-95 transition-all">
              {user ? 'Go to Dashboard' : 'Sign in Now'}
            </Link>
            <button onClick={() => setMobileMenu(false)} className="block w-full py-4 text-stone/40 font-bold uppercase text-[10px] tracking-widest">Close Menu</button>
          </div>
        </div>
      )}

      <section className="relative pt-32 pb-16 md:pt-48 md:pb-40 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/3 h-full bg-chalk/50 -skew-x-12 translate-x-1/2 md:translate-x-20 pointer-events-none opacity-50" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10 text-left">
            <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-clay/20 text-harvest text-[10px] font-bold tracking-[0.2em] uppercase border border-clay/30">
              <Cpu size={12} /> Arbitrum L2 Network
            </div>
            <h1 className="text-5xl md:text-8xl font-bold text-stone-900 leading-[1] tracking-tighter">
              Price justice <br /> 
              <span className="text-forest italic underline decoration-clay/40 underline-offset-[12px]">starts here.</span>
            </h1>
            <p className="text-stone/60 text-lg md:text-xl max-w-xl leading-relaxed font-medium italic">
              Global decentralized supply chain for local farmers. Secure escrow, transparent bidding, and instant Arbitrum settlements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/marketplace" className="bg-forest text-white px-10 py-5 rounded-[2rem] font-bold text-sm shadow-xl hover:bg-forest/95 active:scale-95 transition-all flex items-center justify-center gap-3">
                Start Trading <ArrowRight size={18} />
              </Link>
              <Link href="#how-it-works" className="bg-chalk text-stone px-10 py-5 rounded-[2rem] font-bold text-sm border border-clay flex items-center justify-center active:scale-95 transition-all">
                Learn Protocol
              </Link>
            </div>
          </div>

          <div className="relative group mt-8 lg:mt-0 max-w-md mx-auto lg:max-w-none">
            <div className="absolute inset-0 bg-forest/5 rounded-[3rem] md:rounded-[3.5rem] -rotate-2 scale-105 group-hover:rotate-0 transition-all duration-1000" />
            <div className="relative bg-white border border-clay/30 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.06)] space-y-8">
              <div className="flex justify-between items-center border-b border-chalk pb-6">
                <p className="text-[9px] md:text-[10px] font-bold text-stone/40 uppercase tracking-[0.3em]">Harsa global node stats</p>
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-forest tracking-widest leading-none">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-chalk/40 p-5 md:p-6 rounded-[2rem] border border-clay/10">
                  <p className="text-[9px] font-bold text-stone/40 uppercase mb-2">Crops</p>
                  <p className="text-2xl md:text-4xl font-bold text-forest tracking-tighter leading-none">{realData.products}</p>
                </div>
                <div className="bg-chalk/40 p-5 md:p-6 rounded-[2rem] border border-clay/10">
                  <p className="text-[9px] font-bold text-stone/40 uppercase mb-2">Transactions</p>
                  <p className="text-2xl md:text-4xl font-bold text-forest tracking-tighter leading-none">{realData.transactions}</p>
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <p className="text-[9px] font-bold text-stone/40 uppercase px-2 tracking-widest">Market pulse</p>
                {realData.prices.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-forest text-chalk px-5 py-4 rounded-[1.5rem] md:rounded-[2rem] hover:scale-[1.02] transition-transform">
                    <span className="text-xs md:text-sm font-bold lowercase">{p.commodity_name}</span>
                    <span className="text-xs md:text-sm font-bold italic text-harvest tracking-tight">${(p.current_price/15600).toFixed(2)}/kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 md:py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-12 md:mb-20">
            <Badge className="bg-clay/30 text-forest font-bold mb-6 px-5 py-2 rounded-full border-none text-[10px] uppercase tracking-widest italic">Core Advantages</Badge>
            <h2 className="text-4xl md:text-7xl font-bold text-stone-900 tracking-tighter leading-tight">Technology for farmers' <br className="hidden md:block"/> prosperity.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <FeatureCard icon={<Database className="text-forest" size={28} />} title="Immutable ledger" desc="Every trade is permanently etched into the Arbitrum L2 chain. No more shadow accounting or data tampering." />
            <FeatureCard icon={<ShieldCheck className="text-forest" size={28} />} title="Escrow safety" desc="Buyer funds are locked securely and only released upon verifiable delivery. Protection for both parties." />
            <FeatureCard icon={<TrendingUp className="text-forest" size={28} />} title="Price transparency" desc="Access global market indices to make informed selling decisions. Real-time data for the modern farmer." />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 md:py-32 bg-chalk/30 border-y border-clay/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="space-y-10 md:space-y-12 order-2 lg:order-1">
              <Step num="1" icon={<User className="text-chalk" size={20} />} title="Identity" desc="Initialize your merchant profile. A secure Arbitrum wallet is automatically generated." />
              <Step num="2" icon={<Package className="text-chalk" size={20} />} title="Post Harvest" desc="Upload inventory data and global pricing. Visible instantly to international buyers." />
              <Step num="3" icon={<QrCode className="text-chalk" size={20} />} title="Verify" desc="Verify delivery using dynamic QR codes. Triggers the smart contract release." />
              <Step num="4" icon={<CheckCircle2 className="text-chalk" size={20} />} title="Settle" desc="Funds transferred to your wallet with lightning speed and minimal network fees." />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-forest text-white p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] shadow-[0_60px_100px_rgba(27,67,50,0.15)] relative overflow-hidden text-left">
                <Globe className="absolute -right-20 -bottom-20 opacity-5 w-72 md:w-96 h-72 md:h-96 rotate-12" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6 md:mb-8 tracking-tighter italic leading-none text-harvest">Simple Protocol.</h2>
                <p className="text-emerald-100/70 text-base md:text-lg font-medium leading-relaxed italic mb-8 md:mb-12">
                  "Harsa works as your digital agricultural assistant. We handle the blockchain logic so you can focus on quality produce."
                </p>
                <div className="pt-8 md:pt-12 border-t border-white/10 space-y-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-emerald-200/40">Verified Infrastructure</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"><ShieldCheck size={14} className="text-emerald-400" /> Arbitrum L2</div>
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"><Lock size={14} className="text-emerald-400" /> On-Chain Ledger</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative order-2 md:order-1">
              <div className="w-full aspect-square bg-chalk rounded-[3rem] md:rounded-[4rem] flex items-center justify-center border border-clay/20 relative">
                <div className="absolute inset-8 md:inset-12 bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-forest shrink-0" />
                    <div className="flex-1">
                      <div className="h-2 w-20 bg-slate-100 rounded-full mb-1" />
                      <div className="h-1.5 w-12 bg-slate-50 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-forest text-white p-3 md:p-4 rounded-2xl rounded-tr-none ml-4 md:ml-8 text-[10px] md:text-xs font-medium">Hello! Interested in your premium batch.</div>
                    <div className="bg-chalk p-3 md:p-4 rounded-2xl rounded-tl-none mr-4 md:mr-8 text-[10px] md:text-xs font-medium text-stone/60 italic">Of course! It's fresh harvest.</div>
                  </div>
                </div>
                <MessageSquare className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 text-harvest opacity-10 w-32 md:w-48 h-32 md:h-48" />
              </div>
            </div>
            <div className="space-y-6 md:space-y-8 order-1 md:order-2 text-left">
               <Badge className="bg-harvest/10 text-harvest border-none px-4 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest italic">Direct communication</Badge>
               <h2 className="text-4xl md:text-6xl font-bold text-stone-900 tracking-tighter leading-tight">Global negotiation, <br className="hidden md:block" /> locally managed.</h2>
               <p className="text-stone/50 text-base md:text-lg leading-relaxed italic">
                 Negotiate terms, send farm documentation, and build trust directly with buyers worldwide within the node.
               </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-24 md:py-40 px-6 bg-forest text-white relative overflow-hidden text-left">
        <Cpu className="absolute top-0 right-0 opacity-[0.03] w-[400px] md:w-[600px] h-[400px] md:h-[600px] -translate-y-1/2 translate-x-1/4 rotate-12" />
        <div className="max-w-5xl mx-auto relative z-10 md:text-center">
          <h2 className="text-5xl md:text-8xl font-bold mb-10 md:mb-12 leading-[1] tracking-tighter">Advance local <br className="hidden md:block" /> agriculture now.</h2>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-start md:justify-center">
            <Link href="/register" className="bg-harvest text-forest px-10 md:px-16 py-5 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-bold shadow-2xl active:scale-95 transition-all text-center">Open Merchant Account</Link>
            <Link href="mailto:sarahfajriarahmah@gmail.com" className="bg-white/5 backdrop-blur-md border border-white/10 px-10 md:px-16 py-5 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-bold hover:bg-white/10 transition-all text-center">Support</Link>
          </div>
          <div className="mt-20 md:mt-32 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 text-xl font-bold italic tracking-tighter opacity-50">
              <Leaf size={24} /> Harsa
            </div>
            <p className="text-[9px] font-bold text-emerald-200/20 uppercase tracking-[0.4em]">2026 Protocol Infrastructure</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-white border border-clay/30 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all group text-left">
       <div className="w-14 h-14 bg-chalk rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-sm border border-clay/20">{icon}</div>
       <h3 className="text-xl md:text-2xl font-bold text-stone-900 mb-4 tracking-tight italic leading-none">{title}</h3>
       <p className="text-stone/50 text-sm font-medium leading-relaxed italic">{desc}</p>
    </div>
  );
}

function Step({ num, icon, title, desc }) {
  return (
    <div className="flex gap-6 md:gap-8 group text-left">
      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-forest rounded-2xl flex items-center justify-center shadow-xl relative">
         {icon}
         <span className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-harvest text-forest rounded-full border-4 border-white text-[10px] font-bold flex items-center justify-center">{num}</span>
      </div>
      <div className="space-y-1">
         <h4 className="text-lg md:text-xl font-bold text-stone-900 leading-tight italic tracking-tight">{title}</h4>
         <p className="text-stone/50 text-sm font-medium leading-relaxed italic">{desc}</p>
      </div>
    </div>
  );
}

function Badge({ children, className }) {
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}
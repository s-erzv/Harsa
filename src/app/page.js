"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, TrendingUp, Menu, X, 
  ArrowRight, Leaf, Globe, Zap,
  Package, ShoppingBag, Loader2,
  Database, Wallet, CheckCircle2,
  Lock, MessageSquare, Cpu, Search, Play,
  ExternalLink, Layers, Sparkles
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
        <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl py-3 px-5 rounded-[2rem] shadow-2xl shadow-forest/5 border border-clay/30' : 'bg-transparent py-8 px-2'}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/light.png" alt="Harsa Logo" className="h-8 md:h-10 w-auto group-hover:rotate-6 transition-transform" />
            <span className="text-xl md:text-2xl font-bold tracking-tighter text-forest ">Harsa</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold text-stone tracking-[0.2em] ">
            <a href="#protocol" className="hover:text-forest transition-colors">Protocol</a>
            <a href="#demo" className="hover:text-forest transition-colors">Lab Demo</a>
            <Link href="/marketplace" className="bg-chalk px-4 py-2 rounded-xl text-forest flex items-center gap-2 border border-clay/50">
               Live Node Market
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="bg-forest text-chalk px-6 py-3 rounded-2xl text-[10px] font-bold  tracking-widest shadow-xl shadow-forest/20 active:scale-95 transition-all">Node Control</Link>
            ) : (
              <Link href="/login" className="bg-forest text-chalk px-6 py-3 rounded-2xl text-[10px] font-bold  tracking-widest shadow-xl shadow-forest/20 active:scale-95 transition-all">Access App</Link>
            )}
            <button className="lg:hidden p-3 text-forest bg-chalk rounded-2xl active:scale-90 transition-all border border-clay" onClick={() => setMobileMenu(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>
 
      {mobileMenu && (
        <div className="fixed inset-0 z-[110] bg-white p-8 animate-in fade-in zoom-in duration-300 flex flex-col">
          <div className="flex justify-between items-center mb-16">
             <img src="/light.png" alt="Harsa" className="h-10 w-auto" />
             <button onClick={() => setMobileMenu(false)} className="p-4 bg-chalk rounded-[1.5rem] active:scale-90 transition-all border border-clay"><X size={24} className="text-forest" /></button>
          </div>
          <div className="flex flex-col gap-8 text-5xl font-bold text-stone tracking-tighter ">
            <a href="#protocol" onClick={() => setMobileMenu(false)}>Protocol</a>
            <a href="#demo" onClick={() => setMobileMenu(false)}>Demo</a>
            <Link href="/marketplace" onClick={() => setMobileMenu(false)} className="text-harvest underline decoration-clay underline-offset-8">Market</Link>
          </div>
          <div className="mt-auto pb-10">
            <Link href={user ? "/dashboard" : "/login"} className="block w-full bg-forest text-white py-6 rounded-[2.5rem] text-center font-bold  tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
              {user ? 'Enter Dashboard' : 'Initialize Wallet'}
            </Link>
          </div>
        </div>
      )}
 
      <section className="relative pt-40 pb-20 md:pt-64 md:pb-48 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-chalk -skew-x-12 translate-x-1/3 pointer-events-none opacity-40" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 relative z-10">
            <div className="inline-flex items-center gap-3 py-2.5 px-5 rounded-full bg-forest text-chalk text-[9px] font-bold tracking-[0.3em]  border border-white/10 shadow-xl">
              <Sparkles size={12} className="text-harvest" /> Sepolia Testnet Active
            </div>
            <h1 className="text-6xl md:text-[7rem] font-bold text-stone leading-[0.85] tracking-tighter ">
              Global <br /> 
              <span className="text-forest decoration-clay/40">Sourcing</span><br/>
              <span className="text-stone-300">Protocol.</span>
            </h1>
            <p className="text-stone/60 text-lg md:text-xl max-w-lg leading-relaxed font-medium border-l-4 border-clay pl-6">
              A decentralized L2 supply chain ecosystem. Liquify agricultural assets on Arbitrum with immutable escrow security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/marketplace" className="bg-forest text-white px-10 py-6 rounded-[2.5rem] font-bold text-[10px]  tracking-[0.3em] shadow-2xl shadow-forest/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                Secure Acquisitions <ArrowRight size={18} className="text-harvest" />
              </Link>
              <Link href="#protocol" className="bg-white text-forest px-10 py-6 rounded-[2.5rem] font-bold text-[10px]  tracking-[0.3em] border border-clay flex items-center justify-center active:scale-95 transition-all hover:bg-chalk">
                Docs
              </Link>
            </div>
          </div>
 
          <div className="relative group">
            <div className="absolute -inset-4 bg-forest/5 rounded-[4rem] blur-3xl opacity-50" />
            <div className="relative bg-white border-2 border-clay rounded-[3.5rem] p-8 md:p-12 shadow-[0_50px_100px_rgba(27,67,50,0.08)] space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-stone/30 ">Settlement Engine</p>
                   <h3 className="text-2xl font-bold text-forest  tracking-tighter">Arbitrum One L2</h3>
                </div>
                <div className="p-3 bg-forest rounded-2xl shadow-lg shadow-forest/20">
                   <Layers className="text-chalk" size={24} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-chalk/50 p-6 rounded-[2rem] border border-clay/30">
                  <p className="text-[8px] font-bold text-stone/40  mb-2 tracking-widest">Active Nodes</p>
                  <p className="text-4xl font-bold text-forest tracking-tighter leading-none tabular-nums">{realData.products}</p>
                </div>
                <div className="bg-chalk/50 p-6 rounded-[2rem] border border-clay/30">
                  <p className="text-[8px] font-bold text-stone/40  mb-2 tracking-widest">TPS Latency</p>
                  <p className="text-4xl font-bold text-forest tracking-tighter leading-none tabular-nums">0.2s</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-clay/30">
                <div className="flex justify-between items-center bg-forest text-chalk px-6 py-5 rounded-[2.2rem] transform transition-all group-hover:scale-[1.03] shadow-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                     <span className="text-[10px] font-bold  tracking-widest">On-Chain Pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      <section id="protocol" className="py-32 md:py-48 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-end mb-24">
            <div className="lg:col-span-8 space-y-6">
              <Badge className="bg-clay text-forest font-bold px-6 py-2.5 rounded-full border-none text-[10px]  tracking-[0.3em]">DeFi Infrastructure</Badge>
              <h2 className="text-5xl md:text-8xl font-bold text-stone tracking-[ -0.04em] leading-[0.9] ">Financial <br className="hidden md:block"/> sovereignty <br/> for farmers.</h2>
            </div>
            <div className="lg:col-span-4 pb-4">
               <p className="text-stone/50 font-medium text-lg leading-relaxed">By abstracting the complexity of blockchain, Harsa empowers local producers to access global liquidity without intermediaries.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard icon={<Database className="text-forest" size={32} />} title="Immutable Ledger" desc="Every transaction is cryptographically secured on the Arbitrum chain. Transparent, verifiable, and permanent." />
            <FeatureCard icon={<Lock className="text-forest" size={32} />} title="Escrow Security" desc="Funds are locked in Harsa Smart Contracts and only released upon multisig or QR-verified delivery events." />
            <FeatureCard icon={<Zap className="text-forest" size={32} />} title="Instant Liquidity" desc="No more 30-day payment terms. Settlements happen in real-time once delivery is cryptographically verified." />
          </div>
        </div>
      </section>
 
      <section id="demo" className="py-32 md:py-48 bg-chalk/30 border-y-2 border-clay/20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <h2 className="text-4xl md:text-6xl font-bold text-stone  tracking-tighter leading-none">Protocol in Action</h2>
             <p className="text-stone/40 text-[10px] font-bold ">Watch the Harsa Node Settlement Demo</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-4 bg-forest rounded-[4rem] opacity-5 group-hover:opacity-10 transition-all duration-700" />
            <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-forest shadow-2xl border-[12px] border-white"> 
               <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest to-emerald-900">
                  <button className="w-24 h-24 bg-harvest text-forest rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group/btn">
                     <Play fill="currentColor" size={32} className="ml-2 group-hover/btn:rotate-12 transition-transform" />
                  </button>
               </div> 
               <iframe className="w-full h-full opacity-40 pointer-events-none" src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0&autoplay=1&mute=1&loop=1" />
            </div>
             
            <div className="hidden lg:block absolute -right-20 top-20 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-clay transform rotate-6 hover:rotate-0 transition-transform">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-forest rounded-2xl flex items-center justify-center">
                     <CheckCircle2 className="text-chalk" />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-stone/40  tracking-widest leading-none mb-1">Contract Valid</p>
                     <p className="text-lg font-bold text-forest tracking-tighter  leading-none">Verified 100%</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
 
      <section className="py-32 md:py-48 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 space-y-12">
            <Step num="1" icon={<Wallet className="text-chalk" size={24} />} title="Identity Creation" desc="Petani generates an L2 merchant identity via social or wallet auth. No bank account required." />
            <Step num="2" icon={<Package className="text-chalk" size={24} />} title="Node Publication" desc="Post harvest assets with geographic metadata. Instantly available to the global liquidity pool." />
            <Step num="3" icon={<ShieldCheck className="text-chalk" size={24} />} title="Smart Escrow" desc="Buyers lock liquidity in the Arbitrum Escrow. Assets are held by the protocol until hand-off." />
            <Step num="4" icon={<CheckCircle2 className="text-chalk" size={24} />} title="Verified Settlement" desc="QR-Proof of Delivery triggers the immediate transfer of funds to the producer's wallet." />
          </div>
          <div className="order-1 lg:order-2">
            <div className="bg-forest rounded-[4rem] p-12 md:p-20 text-white relative shadow-2xl shadow-forest/20 overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-harvest opacity-10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
               <h3 className="text-4xl md:text-6xl font-bold  tracking-tighter leading-none mb-8 text-harvest">Built on <br/> Arbitrum One.</h3>
               <p className="text-emerald-100/60 text-lg md:text-xl font-medium leading-relaxed mb-12">
                 We chose Arbitrum to provide the most efficient, secure, and cost-effective DeFi experience for agricultural communities. High throughput, Ethereum-grade security, and negligible fees.
               </p>
               <div className="flex flex-wrap gap-4">
                  <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-400" />
                     <span className="text-[10px] font-bold  tracking-widest">Ethereum Security</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-harvest" />
                     <span className="text-[10px] font-bold  tracking-widest">Optimistic Rollups</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
 
      <footer className="pt-32 pb-16 px-6 bg-forest text-white relative overflow-hidden">
        <Cpu className="absolute top-0 right-0 opacity-[0.05] w-[500px] h-[500px] -translate-y-1/4 translate-x-1/4 rotate-12" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center space-y-10 mb-32">
             <h2 className="text-6xl md:text-[8rem] font-bold leading-[0.8] tracking-tighter ">
               Empower <br/><span className="text-harvest">The Source.</span>
             </h2>
             <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/register" className="bg-harvest text-forest px-12 py-7 rounded-[2.5rem] font-bold text-xs  tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Start Onboarding</Link>
                <Link href="mailto:sarahfajriarahmah@gmail.com" className="bg-white/5 backdrop-blur-md border border-white/10 px-12 py-7 rounded-[2.5rem] font-bold text-xs  tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3">Support Node <ExternalLink size={14} /></Link>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 pt-20 border-t border-white/10 items-center">
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-3xl font-bold tracking-tighter text-harvest ">
                 <img src="/light.png" alt="Logo" className="h-8 w-auto grayscale brightness-200" /> Harsa
               </div>
               <p className="text-emerald-200/30 text-[10px] font-bold ">Agricultural Decentralized Finance Infrastructure</p>
            </div>
            <div className="flex flex-col md:items-end space-y-6">
               <div className="flex gap-8 text-[10px] font-bold text-emerald-200/50  tracking-widest">
                  <a href="#" className="hover:text-harvest">Whitepaper</a>
                  <a href="#" className="hover:text-harvest">Audit</a>
                  <a href="#" className="hover:text-harvest">Network Status</a>
               </div>
               <div className="text-[10px] font-bold text-emerald-200/20  text-right">
                  nupers
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-10 md:p-12 rounded-[3.5rem] bg-white border-2 border-clay shadow-2xl shadow-forest/5 hover:-translate-y-2 transition-all duration-500 group">
       <div className="w-16 h-16 bg-chalk rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-all shadow-xl shadow-forest/5 border border-clay/20">{icon}</div>
       <h3 className="text-2xl md:text-3xl font-bold text-stone mb-6  tracking-tighter leading-none">{title}</h3>
       <p className="text-stone/50 text-sm font-medium leading-relaxed pr-4">{desc}</p>
    </div>
  );
}

function Step({ num, icon, title, desc }) {
  return (
    <div className="flex gap-8 group">
      <div className="flex-shrink-0 w-16 h-16 bg-forest rounded-3xl flex items-center justify-center shadow-2xl shadow-forest/20 relative transform group-hover:scale-110 transition-all duration-500">
         {icon}
         <span className="absolute -top-3 -right-3 w-8 h-8 bg-harvest text-forest rounded-full border-4 border-white text-[10px] font-bold flex items-center justify-center">{num}</span>
      </div>
      <div className="space-y-2">
         <h4 className="text-2xl font-bold text-stone leading-tight  tracking-tighter">{title}</h4>
         <p className="text-stone/50 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Badge({ children, className }) {
  return (
    <span className={`px-5 py-2 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
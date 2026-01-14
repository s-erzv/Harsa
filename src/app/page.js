"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  ShieldCheck, TrendingUp, Menu, X, 
  ArrowRight, Leaf, Globe, Zap,
  Package, ShoppingBag, Loader2,
  Database, Wallet, CheckCircle2,
  Lock, MessageSquare, Cpu, Search, Play,
  ExternalLink, Layers, Sparkles, Coins
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-background text-foreground font-raleway selection:bg-forest selection:text-white overflow-x-hidden text-left transition-colors duration-500">
      
      <nav className={`fixed w-full z-[100] transition-all duration-500 px-4 ${isScrolled ? 'top-2' : 'top-0'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-card/80 backdrop-blur-xl py-3 px-6 rounded-[2.5rem] shadow-2xl border border-border' : 'bg-transparent py-8 px-2'}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/light.png" alt="Logo" className="h-8 md:h-10 w-auto group-hover:rotate-6 transition-transform dark:hidden" />
            <img src="/dark.png" alt="Logo" className="h-8 md:h-10 w-auto group-hover:rotate-6 transition-transform hidden dark:block" />
            <span className="text-xl md:text-2xl font-semibold italic leading-none">Harsa.</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-semibold ">
            <a href="#protocol" className="hover:text-harvest transition-colors opacity-60 hover:opacity-100 italic">Protocol</a>
            <a href="#demo" className="hover:text-harvest transition-colors opacity-60 hover:opacity-100 italic">Lab Demo</a>
            <Link href="/marketplace" className="bg-muted px-5 py-2 rounded-xl text-foreground flex items-center gap-2 border border-border hover:bg-card transition-all italic shadow-inner">
               <Globe size={14} className="text-harvest" /> Live Node Market
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="bg-forest dark:bg-harvest text-white px-6 py-3 rounded-2xl text-[10px] font-bold tracking-widest shadow-2xl active:scale-95 transition-all">DASHBOARD</Link>
            ) : (
              <Link href="/login" className="bg-forest dark:bg-harvest text-white px-6 py-3 rounded-2xl text-[10px] font-bold tracking-widest shadow-2xl active:scale-95 transition-all ">Enter Network</Link>
            )}
            <button className="lg:hidden p-3 text-foreground bg-muted rounded-2xl active:scale-90 transition-all border border-border" onClick={() => setMobileMenu(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>
 
      {mobileMenu && (
        <div className="fixed inset-0 z-[110] bg-background p-8 animate-in fade-in zoom-in duration-300 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-16">
             <img src="/light.png" alt="Harsa" className="h-10 w-auto dark:hidden" />
             <img src="/dark.png" alt="Harsa" className="h-10 w-auto hidden dark:block" />
             <button onClick={() => setMobileMenu(false)} className="p-4 bg-muted rounded-[1.5rem] active:scale-90 transition-all border border-border"><X size={24} className="text-foreground" /></button>
          </div>
          <div className="flex flex-col gap-10 text-6xl font-semibold italic">
            <a href="#protocol" onClick={() => setMobileMenu(false)} className="hover:text-harvest transition-colors">Protocol.</a>
            <a href="#demo" onClick={() => setMobileMenu(false)} className="hover:text-harvest transition-colors">Lab.</a>
            <Link href="/marketplace" onClick={() => setMobileMenu(false)} className="text-harvest underline decoration-border underline-offset-[12px]">Market.</Link>
          </div>
          <div className="mt-auto pb-10 flex flex-col gap-4">
            <ThemeToggle />
            <Link href={user ? "/dashboard" : "/login"} className="block w-full bg-forest dark:bg-harvest text-white py-7 rounded-[2.5rem] text-center font-bold shadow-2xl active:scale-95 transition-all">
              {user ? 'ACCESS DASHBOARD' : 'INITIALIZE WALLET'}
            </Link>
          </div>
        </div>
      )}
 
      <section className="relative pt-40 pb-24 md:pt-64 md:pb-52 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-muted/40 -skew-x-12 translate-x-1/4 pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-harvest/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12 relative z-10">
            <div className="inline-flex items-center gap-3 py-2.5 px-6 rounded-full bg-forest dark:bg-harvest/10 text-white dark:text-harvest text-[9px] font-bold tracking-[0.3em]  border border-white/10 dark:border-harvest/20 shadow-2xl">
              <Sparkles size={12} className="text-harvest" /> Arb-Sepolia Protocol Active
            </div>
            <h1 className="text-6xl md:text-[8rem] font-semibold text-foreground leading-[0.85] italic">
              Global <br /> 
              <span className="text-forest dark:text-harvest">Sourcing</span><br/>
              <span className="opacity-20 italic">Protocol.</span>
            </h1>
            <p className="text-stone/50 text-xl md:text-2xl max-w-xl leading-relaxed font-medium border-l-2 border-harvest pl-8 italic">
              Decentralized supply chain ecosystem. Liquify agricultural assets on Arbitrum L2 with immutable escrow security.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-8">
              <Link href="/marketplace" className="bg-forest dark:bg-harvest text-white px-12 py-7 rounded-[3rem] font-bold text-[11px] tracking-[0.3em]  shadow-2xl shadow-forest/20 dark:shadow-harvest/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4">
                Secure Acquisition <ArrowRight size={20} />
              </Link>
              <Link href="#protocol" className="bg-card text-foreground px-12 py-7 rounded-[3rem] font-semibold text-[11px] tracking-[0.3em]  border border-border flex items-center justify-center active:scale-95 transition-all hover:bg-muted shadow-sm">
                Whitepaper
              </Link>
            </div>
          </div>
 
          <div className="relative group animate-in fade-in zoom-in duration-1000">
            <div className="absolute -inset-8 bg-forest/5 dark:bg-harvest/5 rounded-[5rem] blur-3xl opacity-50" />
            <div className="relative bg-card border-2 border-border rounded-[4rem] p-10 md:p-14 shadow-2xl space-y-12 overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Cpu size={240} /></div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-stone/40  tracking-widest leading-none">Settlement Engine</p>
                   <h3 className="text-3xl font-semibold italic text-forest dark:text-harvest leading-none ">Arbitrum L2 Node</h3>
                </div>
                <div className="p-4 bg-muted rounded-[2rem] border border-border shadow-inner">
                   <Layers className="text-harvest" size={28} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="bg-muted p-8 rounded-[2.5rem] border border-border shadow-sm group-hover:border-harvest/30 transition-colors">
                  <p className="text-[9px] font-bold text-stone/40  mb-4 tracking-widest italic">Inventory Nodes</p>
                  <p className="text-5xl font-semibold text-foreground leading-none tabular-nums italic">{realData.products}<span className="text-xs opacity-20 ml-2">SKU</span></p>
                </div>
                <div className="bg-muted p-8 rounded-[2.5rem] border border-border shadow-sm group-hover:border-harvest/30 transition-colors">
                  <p className="text-[9px] font-bold text-stone/40  mb-4 tracking-widest italic">TPS Latency</p>
                  <p className="text-5xl font-semibold text-foreground leading-none tabular-nums italic">0.2<span className="text-xs opacity-20 ml-2">MS</span></p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <div className="flex justify-between items-center bg-forest dark:bg-harvest text-white p-6 rounded-[2.5rem] shadow-2xl group-hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-4">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                     <span className="text-[10px] font-bold tracking-widest  italic">On-Chain Consensus Active</span>
                  </div>
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      <section id="protocol" className="py-32 md:py-52 bg-card/30 border-y border-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-end mb-32">
            <div className="lg:col-span-8 space-y-8">
              <Badge className="bg-harvest/10 text-harvest font-bold px-6 py-2.5 rounded-full border border-harvest/20 text-[10px] tracking-[0.4em]  italic">Infrastructural DeFi</Badge>
              <h2 className="text-5xl md:text-8xl font-semibold leading-[0.9] italic lowercase">Financial <br className="hidden md:block"/> sovereignty <br/> for producers<span className="text-harvest">.</span></h2>
            </div>
            <div className="lg:col-span-4 pb-4">
               <p className="text-stone/50 font-medium text-xl leading-relaxed italic border-l-2 border-border pl-8 ">By abstracting blockchain complexity, Harsa empowers local nodes to access global liquidity pools directly.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard icon={<Database className="text-harvest" size={32} />} title="Immutable Ledger" desc="Every transaction node is cryptographically secured on Arbitrum. Transparent, verifiable, and permanent provenance." />
            <FeatureCard icon={<Lock className="text-harvest" size={32} />} title="Escrow Staking" desc="Liquidity is locked in Smart Contracts and only released upon multisig verified delivery events." />
            <FeatureCard icon={<Zap className="text-harvest" size={32} />} title="Real-time Settlement" desc="Eliminating 30-day payment cycles. Settlements occur instantly once logistics node synchronization is confirmed." />
          </div>
        </div>
      </section>
 
      <section id="demo" className="py-32 md:py-52 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
             <h2 className="text-4xl md:text-7xl font-semibold leading-none italic italic">Protocol in Action<span className="text-harvest">.</span></h2>
             <p className="text-stone/40 text-[11px] font-bold  tracking-[0.4em]">Harsa Node Terminal Demo</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-10 bg-forest/10 dark:bg-harvest/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
            <div className="relative aspect-video rounded-[3rem] md:rounded-[4rem] overflow-hidden bg-card shadow-2xl border-[12px] border-muted"> 
               {/* <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-10 group-hover:backdrop-blur-0 transition-all">
                  <button className="w-28 h-28 bg-harvest text-white rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group/btn rotate-12 hover:rotate-0">
                     <Play fill="currentColor" size={36} className="ml-2" />
                  </button>
               </div>  */}
               <iframe className="w-full h-full opacity-60 scale-105" src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0&autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ" />
            </div>
             
            <div className="hidden lg:block absolute -right-24 bottom-1/4 bg-card p-10 rounded-[3rem] shadow-2xl border-2 border-border transform rotate-6 hover:rotate-0 transition-all duration-700">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                     <ShieldCheck size={28} />
                  </div>
                  <div className="text-left">
                     <p className="text-[10px] font-bold text-stone/40 tracking-widest leading-none mb-1.5  italic">Contract Status</p>
                     <p className="text-xl font-semibold italic leading-none">VERIFIED 100%</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
 
      <section className="py-32 md:py-52 px-6 bg-card/20 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <div className="order-2 lg:order-1 space-y-14">
            <Step num="01" icon={<Wallet className="text-white" size={24} />} title="Identity Genesis" desc="Producer generates an L2 merchant identity via social or wallet auth. Non-custodial and secure." />
            <Step num="02" icon={<Package className="text-white" size={24} />} title="Asset Publication" desc="Authorize harvest assets with geographic node metadata. Instantly pooled into global liquidity." />
            <Step num="03" icon={<ShieldCheck className="text-white" size={24} />} title="Escrow Consensus" desc="Buyers lock settlement liquidity. Assets are held by the protocol until logistics hand-off." />
            <Step num="04" icon={<CheckCircle2 className="text-white" size={24} />} title="Atomic Settlement" desc="Verified Proof of Delivery triggers the immediate release of locked funds to the node." />
          </div>
          <div className="order-1 lg:order-2">
            <div className="bg-forest dark:bg-harvest/10 rounded-[4rem] p-12 md:p-20 text-white dark:text-harvest relative shadow-2xl overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 w-80 h-80 bg-harvest opacity-10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <h3 className="text-4xl md:text-7xl font-semibold leading-[0.9] mb-10 italic ">Built on <br/> Arbitrum<span className="text-harvest">.</span></h3>
               <p className="text-white/30 dark:text-harvest/40 text-xl md:text-2xl font-medium leading-relaxed mb-16 italic lowercase">
                 Providing the most efficient DeFi experience for agricultural nodes. Ethereum-grade security with negligible latency.
               </p>
               <div className="flex flex-wrap gap-5">
                  <div className="bg-white/5 dark:bg-black/20 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-blue-400" />
                     <span className="text-[10px] font-bold  tracking-widest italic">Base: Ethereum</span>
                  </div>
                  <div className="bg-white/5 dark:bg-black/20 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-harvest" />
                     <span className="text-[10px] font-bold  tracking-widest italic">Optimistic Consenus</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
 
      <footer className="pt-40 pb-20 px-6 bg-card border-t border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none rotate-12 -translate-y-1/4"><Globe size={800} /></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-12 mb-40">
             <h2 className="text-6xl md:text-[10rem] font-semibold leading-[0.8] italic lowercase">
                Empower <br/><span className="text-forest dark:text-harvest">The Source.</span>
             </h2>
             <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/register" className="bg-forest dark:bg-harvest text-white px-14 py-8 rounded-[3rem] font-bold text-xs tracking-[0.4em]  shadow-2xl hover:scale-[1.03] active:scale-95 transition-all">Onboard Identity</Link>
                <Link href="mailto:support@harsa.network" className="bg-muted text-foreground border border-border px-14 py-8 rounded-[3rem] font-bold text-xs tracking-[0.4em]  hover:bg-card transition-all flex items-center gap-3 shadow-sm">Support Node <ExternalLink size={18} /></Link>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 pt-20 border-t border-border items-center">
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-4xl font-semibold italic">
                 <img src="/light.png" alt="Logo" className="h-10 w-auto dark:hidden" />
                 <img src="/dark.png" alt="Logo" className="h-10 w-auto hidden dark:block" />
                 Harsa.
               </div>
               <p className="text-stone/30 text-[10px] font-bold  tracking-[0.3em] italic">Agricultural Decentralized Infrastructure Protocol</p>
            </div>
            <div className="flex flex-col md:items-end space-y-8">
               <div className="flex gap-10 text-[10px] font-bold text-stone/40  italic">
                  <a href="#" className="hover:text-harvest transition-colors">Whitepaper</a>
                  <a href="#" className="hover:text-harvest transition-colors">Audit</a>
                  <a href="#" className="hover:text-harvest transition-colors">Arbiscan</a>
               </div>
               <div className="text-[10px] font-bold text-stone/20 tracking-widest  italic">
                  &copy; 2026 Harsa Node Protocol
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
    <div className="p-10 md:p-14 rounded-[4rem] bg-card border-2 border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative overflow-hidden">
       <div className="absolute inset-0 bg-harvest/5 opacity-0 group-hover:opacity-100 transition-opacity" />
       <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner border border-border relative z-10">{icon}</div>
       <h3 className="text-3xl font-semibold text-foreground mb-6 italic leading-none relative z-10 lowercase">{title}<span className="text-harvest">.</span></h3>
       <p className="text-stone/50 text-base font-medium leading-relaxed pr-4 relative z-10 italic">{desc}</p>
    </div>
  );
}

function Step({ num, icon, title, desc }) {
  return (
    <div className="flex gap-10 group">
      <div className="flex-shrink-0 w-20 h-20 bg-forest dark:bg-harvest text-white rounded-[2rem] flex items-center justify-center shadow-2xl relative transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
         {icon}
         <span className="absolute -top-3 -right-3 w-10 h-10 bg-background text-foreground border-4 border-muted rounded-full text-[12px] font-bold italic flex items-center justify-center shadow-lg">{num}</span>
      </div>
      <div className="space-y-3 text-left">
         <h4 className="text-2xl font-semibold text-foreground leading-tight italic lowercase">{title}<span className="text-harvest">.</span></h4>
         <p className="text-stone/50 text-sm font-medium leading-relaxed italic">{desc}</p>
      </div>
    </div>
  );
}
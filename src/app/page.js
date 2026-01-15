"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  ShieldCheck, TrendingUp, Menu, X, 
  ArrowRight, Leaf, Globe, Zap,
  Package, ShoppingBag, Loader2,
  Database, Wallet, CheckCircle2,
  Lock, MessageSquare, Cpu, Search, Play,
  ExternalLink, Layers, Sparkles, Navigation,
  QrCode, ScanLine, Map as MapIcon, Activity,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Script from 'next/script';
import { QRCodeSVG } from 'qrcode.react';

export default function LandingPage() {
  const { user, supabase } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [realData, setRealData] = useState({ products: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    fetchRealStats();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchRealStats = async () => {
    try {
      const [prodRes, txRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('transactions').select('id', { count: 'exact' })
      ]);
      setRealData({
        products: prodRes.count || 0,
        transactions: txRes.count || 0
      });
    } catch (e) { 
      console.error("stats sync error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps || mapInstanceRef.current) return;
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: -6.2088, lng: 106.8456 },
          zoom: 5,
          styles: mapStyle,
          disableDefaultUI: true,
        });
        mapInstanceRef.current = map;
        const locations = [
          { lat: -6.9175, lng: 107.6191 },
          { lat: -7.2575, lng: 112.7521 },
          { lat: -7.7956, lng: 110.3695 },
          { lat: -0.9478, lng: 100.4172 },
        ];
        locations.forEach((pos) => {
          new window.google.maps.Marker({
            position: pos,
            map: map,
            label: { text: "🌿", fontSize: "16px" },
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }
          });
        });
      } catch (err) { console.error("map error:", err); }
    };

    if (googleReady) initMap();
  }, [googleReady]);

  return (
    <div className="min-h-screen bg-background text-foreground font-raleway selection:bg-forest selection:text-white overflow-x-hidden text-left transition-colors duration-500">
      
      <Script 
        id="google-maps-landing"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />

      <nav className={`fixed w-full z-[100] transition-all duration-500 px-4 ${isScrolled ? 'top-2' : 'top-0'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-card/80 backdrop-blur-xl py-3 px-4 md:px-6 rounded-[2rem] shadow-2xl border border-border' : 'bg-transparent py-6 md:py-8 px-2'}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/light.png" alt="Logo" className="h-8 md:h-10 w-auto group-hover:rotate-6 transition-transform dark:hidden" />
            <img src="/dark.png" alt="Logo" className="h-8 md:h-10 w-auto group-hover:rotate-6 transition-transform hidden dark:block" />
            <span className="text-lg md:text-2xl font-semibold italic leading-none">harsa.</span>
          </Link>
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-semibold uppercase tracking-widest">
            <a href="#protocol" className="hover:text-harvest transition-colors opacity-60 hover:opacity-100 italic">protocol</a>
            <a href="#demo" className="hover:text-harvest transition-colors opacity-60 hover:opacity-100 italic">demo</a>
            <a href="#nodes" className="hover:text-harvest transition-colors opacity-60 hover:opacity-100 italic">nodes</a>
            <Link href="/marketplace" className="bg-muted px-5 py-2 rounded-xl text-foreground flex items-center gap-2 border border-border hover:bg-card transition-all italic shadow-inner">
               <Globe size={14} className="text-harvest" /> live node market
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="bg-forest dark:bg-harvest text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold tracking-widest shadow-xl active:scale-95 transition-all">dashboard</Link>
            ) : (
              <Link href="/login" className="bg-forest dark:bg-harvest text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold tracking-widest shadow-xl active:scale-95 transition-all ">access</Link>
            )}
            <button className="lg:hidden p-2.5 text-foreground bg-muted rounded-xl active:scale-90 transition-all border border-border" onClick={() => setMobileMenu(true)}>
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-[110] bg-background p-6 md:p-8 animate-in fade-in zoom-in duration-300 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-12 md:mb-16">
             <img src="/light.png" alt="Harsa" className="h-8 md:h-10 w-auto dark:hidden" />
             <img src="/dark.png" alt="Harsa" className="h-8 md:h-10 w-auto hidden dark:block" />
             <button onClick={() => setMobileMenu(false)} className="p-3 bg-muted rounded-xl active:scale-90 transition-all border border-border"><X size={20} className="text-foreground" /></button>
          </div>
          <div className="flex flex-col gap-6 md:gap-10 text-4xl md:text-6xl font-semibold italic">
            <a href="#protocol" onClick={() => setMobileMenu(false)} className="hover:text-harvest transition-colors">protocol.</a>
            <a href="#demo" onClick={() => setMobileMenu(false)} className="hover:text-harvest transition-colors">lab.</a>
            <a href="#nodes" onClick={() => setMobileMenu(false)} className="hover:text-harvest transition-colors">nodes.</a>
            <Link href="/marketplace" onClick={() => setMobileMenu(false)} className="text-harvest underline decoration-border underline-offset-[12px]">market.</Link>
          </div>
          <div className="mt-auto pb-6 md:pb-10 flex flex-col gap-4">
            <ThemeToggle />
            <Link href={user ? "/dashboard" : "/login"} className="block w-full bg-forest dark:bg-harvest text-white py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] text-center font-bold shadow-2xl active:scale-95 transition-all">
              {user ? 'access dashboard' : 'initialize wallet'}
            </Link>
          </div>
        </div>
      )}

      <section className="relative pt-32 pb-16 md:pt-64 md:pb-52 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-muted/40 -skew-x-12 translate-x-1/4 pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-harvest/10 rounded-full blur-[80px] md:blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="space-y-8 md:space-y-12 relative z-10 text-left">
            <div className="inline-flex items-center gap-3 py-2 px-4 md:px-6 rounded-full bg-forest dark:bg-harvest/10 text-white dark:text-harvest text-[8px] md:text-[9px] font-bold tracking-[0.3em] border border-white/10 dark:border-harvest/20 shadow-2xl">
              <Sparkles size={10} className="text-harvest" /> arb-sepolia protocol active
            </div>
            <h1 className="text-5xl md:text-[8rem] font-semibold text-foreground leading-[1.1] md:leading-[0.85] italic tracking-tighter">
              global <br className="hidden md:block" /> 
              <span className="text-forest dark:text-harvest">sourcing</span><br className="hidden md:block" />
              <span className="opacity-20 italic">protocol.</span>
            </h1>
            <p className="text-stone/50 text-base md:text-2xl max-w-xl leading-relaxed font-medium border-l-2 border-harvest pl-6 md:pl-8 italic">
              decentralized supply chain ecosystem. liquify agricultural assets on arbitrum l2 with immutable escrow security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5 pt-4 md:pt-8 justify-start">
              <Link href="/marketplace" className="w-full sm:w-auto bg-forest dark:bg-harvest text-white px-8 md:px-12 py-5 md:py-7 rounded-2xl md:rounded-[3rem] font-bold text-[10px] md:text-[11px] tracking-[0.3em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 uppercase">
                secure acquisition <ArrowRight size={18} />
              </Link>
            </div>
          </div>
 
          <div className="relative group px-0 md:px-0 animate-in fade-in zoom-in duration-1000">
            <div className="absolute -inset-4 md:-inset-8 bg-forest/5 dark:bg-harvest/5 rounded-[3rem] md:rounded-[5rem] blur-2xl md:blur-3xl opacity-50" />
            <div className="relative bg-card border-2 border-border rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-14 shadow-2xl space-y-8 md:space-y-12 overflow-hidden text-left">
              <div className="absolute top-0 right-0 p-6 md:p-12 opacity-[0.03] pointer-events-none rotate-12"><Cpu size={120} className="md:w-60 md:h-60" /></div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-1 md:space-y-2">
                   <p className="text-[8px] md:text-[10px] font-bold text-stone/40 tracking-widest leading-none uppercase">settlement engine</p>
                   <h3 className="text-xl md:text-3xl font-semibold italic text-forest dark:text-harvest leading-none">arbitrum l2 node</h3>
                </div>
                <div className="p-3 md:p-4 bg-muted rounded-xl md:rounded-[2rem] border border-border shadow-inner">
                   <Layers className="text-harvest w-5 h-5 md:w-7 md:h-7" size={28} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
                <div className="bg-muted p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-border shadow-sm group-hover:border-harvest/30 transition-colors">
                  <p className="text-[7px] md:text-[9px] font-bold text-stone/40 mb-2 md:mb-4 tracking-widest italic uppercase">inventory nodes</p>
                  <p className="text-2xl md:text-5xl font-semibold text-foreground leading-none tabular-nums italic">{realData.products}<span className="text-[10px] md:text-xs opacity-20 ml-1 md:ml-2">sku</span></p>
                </div>
                <div className="bg-muted p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-border shadow-sm group-hover:border-harvest/30 transition-colors">
                  <p className="text-[7px] md:text-[9px] font-bold text-stone/40 mb-2 md:mb-4 tracking-widest italic uppercase">active nodes</p>
                  <p className="text-2xl md:text-5xl font-semibold text-foreground leading-none tabular-nums italic">{realData.transactions}<span className="text-[10px] md:text-xs opacity-20 ml-1 md:ml-2">tx</span></p>
                </div>
              </div>

              <div className="pt-4 md:pt-6 border-t border-border/50">
                <div className="flex justify-between items-center bg-forest dark:bg-harvest text-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-2xl group-hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3 md:gap-4">
                     <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                     <span className="text-[8px] md:text-[10px] font-bold tracking-widest italic uppercase">consensus active</span>
                  </div>
                  <CheckCircle2 size={18} className="md:w-6 md:h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="nodes" className="py-16 md:py-32 px-4 md:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card border-2 border-border rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl relative text-left">
            <div className="grid lg:grid-cols-12">
              <div className="lg:col-span-4 p-8 md:p-14 space-y-6 md:space-y-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border">
                <div className="p-3 bg-harvest/10 rounded-2xl text-harvest w-fit border border-harvest/20">
                  <MapIcon size={24} />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <h2 className="text-3xl md:text-4xl font-semibold italic tracking-tighter leading-none lowercase">global node <br className="hidden md:block" /> distribution<span className="text-harvest">.</span></h2>
                  <p className="text-stone/50 text-sm leading-relaxed italic">
                    visualize the network of producers and transit points across the harsa ecosystem. real-time geographic telemetry powered by l2.
                  </p>
                </div>
                <div className="pt-4 md:pt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-black text-stone/40 uppercase tracking-widest">active hubs</p>
                    <p className="text-xl md:text-2xl font-bold italic">12 nodes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] font-black text-stone/40 uppercase tracking-widest">uptime</p>
                    <p className="text-xl md:text-2xl font-bold italic text-emerald-500">99.9%</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8 h-[350px] md:h-[600px] relative">
                <div ref={mapRef} className="w-full h-full grayscale-[0.5] dark:grayscale-[0.8] opacity-80" />
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] md:shadow-[inset_0_0_150px_rgba(0,0,0,0.2)]" />
              </div>
            </div>
          </div>
        </div>
      </section>
 
      <section id="protocol" className="py-20 md:py-52 bg-card/30 border-y border-border px-4 md:px-6 scroll-mt-20 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-end mb-16 md:mb-32">
            <div className="lg:col-span-8 space-y-6 md:space-y-8">
              <Badge className="bg-harvest/10 text-harvest font-bold px-5 md:px-6 py-2 md:py-2.5 rounded-full border border-harvest/20 text-[9px] md:text-[10px] tracking-[0.4em] italic uppercase">infrastructural defi</Badge>
              <h2 className="text-4xl md:text-8xl font-semibold leading-[1.1] md:leading-[0.9] italic lowercase text-left">financial <br className="hidden md:block"/> sovereignty <br className="hidden md:block"/> for producers<span className="text-harvest">.</span></h2>
            </div>
            <div className="lg:col-span-4 pb-0 md:pb-4">
               <p className="text-stone/50 font-medium text-base md:text-xl leading-relaxed italic border-l-2 border-border pl-6 md:pl-8 text-left">by abstracting blockchain complexity, harsa empowers local nodes to access global liquidity pools directly.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <FeatureCard icon={<Database size={32} />} title="immutable ledger" desc="every transaction node is cryptographically secured on arbitrum. transparent, verifiable, and permanent provenance." />
            <FeatureCard icon={<Lock size={32} />} title="escrow staking" desc="liquidity is locked in smart contracts and only released upon multisig verified delivery events." />
            <FeatureCard icon={<Zap size={32} />} title="real-time settlement" desc="eliminating 30-day payment cycles. settlements occur instantly once logistics node synchronization is confirmed." />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-4 md:px-6 overflow-hidden text-left">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="relative group">
            <div className="absolute -inset-10 bg-harvest/10 rounded-full blur-3xl opacity-30" />
            <div className="relative bg-card border-2 border-border rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 flex items-center justify-center shadow-2xl">
               <div className="relative">
                  <div className="absolute -inset-4 border-2 border-harvest rounded-2xl md:rounded-3xl animate-[pulse_2s_infinite] opacity-40" />
                  <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-inner border border-border">
                    <QRCodeSVG 
                      value="https://harsa.network/track/TX-HARSA-001" 
                      size={160}
                      className="md:w-[200px] md:h-[200px]"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="absolute -top-6 -right-6 md:-top-10 md:-right-10 p-3 md:p-4 bg-forest dark:bg-harvest text-white rounded-xl md:rounded-2xl shadow-2xl rotate-12 flex items-center gap-2">
                     <ScanLine size={18} className="md:w-5 md:h-5" />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">scanning...</span>
                  </div>
               </div>
            </div>
          </div>
          <div className="space-y-8 md:space-y-10">
            <Badge className="bg-forest/10 text-forest dark:text-harvest border border-forest/20 text-[9px] md:text-[10px] tracking-[0.4em] italic uppercase">atomic proof</Badge>
            <h2 className="text-4xl md:text-7xl font-semibold italic tracking-tighter leading-[1.1] md:leading-[0.9] lowercase">qr verified <br className="hidden md:block" /> hand-offs<span className="text-harvest">.</span></h2>
            <p className="text-stone/50 text-lg md:text-xl leading-relaxed italic max-w-lg">
              seamlessly bridge physical assets and digital settlements. scan to update logistics nodes or release escrowed liquidity instantly.
            </p>
            <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-harvest shrink-0"><Check size={20} /></div>
                <span className="text-sm md:text-base font-bold italic">zero-knowledge proof compatible</span>
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-harvest shrink-0"><Check size={20} /></div>
                <span className="text-sm md:text-base font-bold italic">immutable logistics provenance</span>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      <section id="demo" className="py-20 md:py-52 px-4 md:px-6 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-left md:text-center mb-16 md:mb-24 space-y-4">
             <h2 className="text-4xl md:text-7xl font-semibold italic tracking-tighter leading-none lowercase text-foreground">protocol in action<span className="text-harvest">.</span></h2>
             <p className="text-stone/40 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em]">harsa node terminal demo</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto group px-2 md:px-0">
            <div className="absolute -inset-1 bg-harvest/20 rounded-2xl md:rounded-[4.2rem] opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <div className="relative aspect-video rounded-2xl md:rounded-[4rem] overflow-hidden bg-card shadow-2xl border-[6px] md:border-[12px] border-muted"> 
               <iframe 
                className="w-full h-full opacity-80 group-hover:opacity-100 transition-all grayscale-[0.2] group-hover:grayscale-0" 
                src="https://www.youtube.com/embed/P64fIN__3Ng?autoplay=1&mute=1&loop=1&playlist=P64fIN__3Ng" 
                title="harsa demo video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
               />
            </div>
             
            <div className="hidden lg:block absolute -right-24 bottom-1/4 bg-card p-10 rounded-[3rem] shadow-2xl border-2 border-border transform rotate-6 hover:rotate-0 transition-all duration-700 z-30">
               <div className="flex items-center gap-6 text-left">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                     <ShieldCheck size={32} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-stone/40 tracking-widest leading-none mb-1.5 uppercase italic">contract status</p>
                     <p className="text-xl font-bold italic tracking-tighter leading-none text-foreground uppercase">verified 100%</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
 
      <section className="py-20 md:py-52 px-4 md:px-6 bg-card/20 overflow-hidden border-t border-border text-left">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:gap-32 items-center">
          <div className="order-2 lg:order-1 space-y-10 md:space-y-14">
            <Step num="01" icon={<Wallet className="text-white" size={20} />} title="identity genesis" desc="producer generates an l2 merchant identity via social or wallet auth. non-custodial and secure." />
            <Step num="02" icon={<Package className="text-white" size={20} />} title="asset publication" desc="authorize harvest assets with geographic node metadata. instantly pooled into global liquidity." />
            <Step num="03" icon={<ShieldCheck className="text-white" size={20} />} title="escrow consensus" desc="buyers lock settlement liquidity. assets are held by the protocol until logistics hand-off." />
            <Step num="04" icon={<CheckCircle2 className="text-white" size={20} />} title="atomic settlement" desc="verified proof of delivery triggers the immediate release of locked funds to the node." />
          </div>
          <div className="order-1 lg:order-2">
            <div className="bg-forest dark:bg-harvest/10 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 text-white dark:text-harvest relative shadow-2xl overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-harvest opacity-10 rounded-full blur-[80px] md:blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <h3 className="text-3xl md:text-7xl font-semibold leading-[1.1] md:leading-[0.9] mb-6 md:mb-10 italic uppercase">built on <br className="hidden md:block" /> arbitrum<span className="text-harvest">.</span></h3>
               <p className="text-white/30 dark:text-harvest/40 text-lg md:text-2xl font-medium leading-relaxed mb-10 md:mb-16 italic lowercase">
                 providing the most efficient defi experience for agricultural nodes. ethereum-grade security with negligible latency.
               </p>
               <div className="flex flex-wrap gap-4 md:gap-5">
                  <div className="bg-white/5 dark:bg-black/20 border border-white/10 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3">
                     <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-blue-400" />
                     <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest italic">base: ethereum</span>
                  </div>
                  <div className="bg-white/5 dark:bg-black/20 border border-white/10 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3">
                     <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-harvest" />
                     <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest italic">optimistic consensus</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
 
      <footer className="pt-24 md:pt-40 pb-16 md:pb-20 px-4 md:px-6 bg-card border-t border-border relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none rotate-12 -translate-y-1/4"><Globe size={800} className="md:w-[800px]" /></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-left md:text-center space-y-10 md:space-y-12 mb-24 md:mb-40">
             <h2 className="text-5xl md:text-[10rem] font-semibold leading-[1.1] md:leading-[0.8] italic lowercase">
                empower <br className="hidden md:block" /><span className="text-forest dark:text-harvest">the source.</span>
             </h2>
             <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-start md:justify-center">
                <Link href="/register" className="bg-forest dark:bg-harvest text-white px-10 md:px-14 py-6 md:py-8 rounded-2xl md:rounded-[3rem] font-bold text-xs tracking-[0.4em] uppercase shadow-2xl hover:scale-[1.03] active:scale-95 transition-all text-center">onboard identity</Link>
                <Link href="mailto:support@harsa.network" className="bg-muted text-foreground border border-border px-10 md:px-14 py-6 md:py-8 rounded-2xl md:rounded-[3rem] font-bold text-xs tracking-[0.4em] uppercase hover:bg-card transition-all flex items-center justify-center gap-3 shadow-sm">support node <ExternalLink size={18} /></Link>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16 pt-16 md:pt-20 border-t border-border items-center">
            <div className="space-y-3 md:space-y-4">
               <div className="flex items-center gap-3 md:gap-4 text-3xl md:text-4xl font-semibold italic leading-none text-left">
                 <img src="/light.png" alt="Logo" className="h-8 md:h-10 w-auto dark:hidden" />
                 <img src="/dark.png" alt="Logo" className="h-8 md:h-10 w-auto hidden dark:block" />
                 harsa.
               </div>
               <p className="text-stone/30 text-[9px] md:text-[10px] font-bold tracking-[0.3em] italic uppercase text-left">agricultural decentralized infrastructure protocol</p>
            </div>
            <div className="flex flex-col md:items-end space-y-6 md:space-y-8">
               <div className="flex flex-wrap gap-6 md:gap-10 text-[9px] md:text-[10px] font-bold text-stone/40 italic uppercase justify-start">
                  <a href="https://xislqbfngvonwewkmbmv.supabase.co/storage/v1/object/public/avatars/Harsa.pdf" target="_blank" className="hover:text-harvest transition-colors">whitepaper</a>
                  <a href="#" className="hover:text-harvest transition-colors">audit</a>
                  <a href="#" className="hover:text-harvest transition-colors">arbiscan</a>
               </div>
               <div className="text-[9px] md:text-[10px] font-bold text-stone/20 tracking-widest italic uppercase text-left">
                  &copy; 2026 harsa node protocol
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
    <div className="p-8 md:p-14 rounded-3xl md:rounded-[4rem] bg-card border-2 border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative overflow-hidden text-left">
       <div className="absolute inset-0 bg-harvest/5 opacity-0 group-hover:opacity-100 transition-opacity" />
       <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-8 md:mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner border border-border relative z-10 text-harvest">{icon}</div>
       <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 md:mb-6 italic leading-none relative z-10 lowercase">{title}<span className="text-harvest">.</span></h3>
       <p className="text-stone/50 text-sm md:text-base font-medium leading-relaxed pr-2 md:pr-4 relative z-10 italic">{desc}</p>
    </div>
  );
}

function Step({ num, icon, title, desc }) {
  return (
    <div className="flex gap-6 md:gap-10 group text-left">
      <div className="flex-shrink-0 w-14 h-14 md:w-20 md:h-20 bg-forest dark:bg-harvest text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl relative transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
         {icon}
         <span className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-background text-foreground border-2 md:border-4 border-muted rounded-full text-[10px] md:text-[12px] font-bold italic flex items-center justify-center shadow-lg">{num}</span>
      </div>
      <div className="space-y-2 md:space-y-3">
         <h4 className="text-xl md:text-2xl font-semibold text-foreground leading-tight italic lowercase">{title}<span className="text-harvest">.</span></h4>
         <p className="text-stone/50 text-sm md:text-sm font-medium leading-relaxed italic">{desc}</p>
      </div>
    </div>
  );
}

const mapStyle = [
  { "featureType": "water", "stylers": [{ "color": "#e9e9e9" }] },
  { "featureType": "landscape", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
];
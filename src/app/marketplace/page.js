"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, Filter, MapPin, ShieldCheck, LayoutDashboard,
  ArrowRight, Loader2, Star, Check, Package, LogIn, Globe, 
  Navigation, Sparkles, Layers, Coins, User
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getMarketRates } from '@/utils/blockchain' 

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ThemeToggle from '@/components/ThemeToggle'

export default function Marketplace() {
  const { supabase, user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [userLocation, setUserLocation] = useState(null)
  const [sortByNearby, setSortByNearby] = useState(false)
  const [rates, setRates] = useState(null)

  const categories = ['All Categories', 'Rice', 'Vegetables', 'Fruits', 'Spices', 'Others']

  useEffect(() => {
    fetchInitialData()
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    }
  }, [user])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const cachedRates = sessionStorage.getItem('harsa_market_rates')
      let marketRates = cachedRates ? JSON.parse(cachedRates) : null

      const promises = [
        supabase
          .from('products')
          .select('*, profiles(id, full_name, reputation_score, location, latitude, longitude, wallet_address)')
          .order('created_at', { ascending: false })
      ]

      if (!marketRates) {
        promises.push(getMarketRates())
      }

      const [prodRes, rateRes] = await Promise.all(promises)
      
      if (!prodRes.error) setProducts(prodRes.data || [])
      
      const finalRates = marketRates || rateRes
      setRates(finalRates)
      if (rateRes) sessionStorage.setItem('harsa_market_rates', JSON.stringify(rateRes))

    } finally {
      setLoading(false)
    }
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null
    const R = 6371 
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const { globalProducts, myProducts } = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All Categories' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    return {
      globalProducts: filtered.filter(p => p.seller_id !== user?.id),
      myProducts: filtered.filter(p => p.seller_id === user?.id)
    }
  }, [products, searchTerm, selectedCategory, user?.id])

  const sortedGlobal = useMemo(() => {
    if (sortByNearby && userLocation) {
      return [...globalProducts].sort((a, b) => {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.profiles?.latitude, a.profiles?.longitude) || Infinity
        const distB = getDistance(userLocation.lat, userLocation.lng, b.profiles?.latitude, b.profiles?.longitude) || Infinity
        return distA - distB
      })
    }
    return globalProducts
  }, [globalProducts, sortByNearby, userLocation])

  return (
    <div className="min-h-screen bg-background text-foreground font-raleway pb-32 transition-colors duration-500 overflow-x-hidden">
      
      <nav className="fixed w-full bg-background/80 backdrop-blur-md border-b border-border/50 z-[100]">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/light.png" alt="Logo" className="h-8 w-auto dark:hidden transition-transform group-hover:rotate-6" />
            <img src="/dark.png" alt="Logo" className="h-8 w-auto hidden dark:block transition-transform group-hover:rotate-6" />
            <span className="text-xl font-bold italic tracking-tighter leading-none">Harsa.</span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4"> 
            <ThemeToggle />
            <Button 
              variant="outline"
              onClick={() => setSortByNearby(!sortByNearby)}
              className={`rounded-2xl h-11 px-4 text-[11px] font-bold transition-all gap-2 border-border ${sortByNearby ? 'bg-harvest text-white border-none shadow-lg' : 'hover:bg-muted'}`}
            >
              <Navigation size={14} className={sortByNearby ? "animate-pulse" : ""} /> 
              <span className="hidden sm:block">{sortByNearby ? 'Nearby Active' : 'Filter Nearby'}</span>
            </Button>

            <Link href={user ? "/dashboard" : "/login"}>
              <Button className="rounded-2xl bg-forest dark:bg-harvest text-white h-11 px-5 gap-2 text-[11px] font-bold shadow-xl active:scale-95 transition-all">
                {user ? <><LayoutDashboard size={14} /> <span className="hidden sm:block">Dashboard</span></> : <LogIn size={14} />}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 md:pt-44 max-w-7xl mx-auto px-6 md:px-10">
        
        <header className="mb-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-3 py-2 px-4 rounded-full bg-muted border border-border shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone/60">Arb-Sepolia Protocol Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] italic">
              Sourcing <br/> <span className="text-forest dark:text-harvest">The Future</span> <br/> <span className="opacity-30">of Food.</span>
            </h1>
            
            <p className="text-stone/50 text-lg font-medium italic border-l-2 border-harvest/50 pl-6 max-w-lg leading-relaxed">
              Explore the poetic supply chain. Peer-to-peer asset acquisition secured by decentralized escrow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/20 group-focus-within:text-harvest transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Find harvest node..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 rounded-[2rem] bg-card border border-border focus:border-harvest outline-none transition-all text-sm font-semibold italic shadow-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-[2rem] h-[60px] px-8 border-border hover:bg-card gap-3 font-bold text-xs">
                    <Filter size={18} className="text-harvest" /> {selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-3xl p-3 bg-card border-border shadow-2xl">
                  {categories.map((cat) => (
                    <DropdownMenuItem 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-2xl px-4 py-3 text-[11px] font-bold flex justify-between cursor-pointer mb-1 transition-all ${selectedCategory === cat ? 'bg-forest dark:bg-harvest text-white' : 'hover:bg-muted'}`}
                    >
                      {cat} {selectedCategory === cat && <Check size={14} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="hidden lg:block relative transform rotate-2 hover:rotate-0 transition-all duration-1000 group">
            <div className="absolute inset-0 bg-harvest/10 rounded-[4rem] blur-3xl opacity-50 transition-opacity" />
            <div className="relative bg-card border-2 border-border rounded-[4rem] p-12 shadow-2xl space-y-10">
              <div className="flex justify-between items-center border-b border-border pb-8">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-muted rounded-3xl border border-border shadow-inner">
                      <Layers className="text-harvest" size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest">Protocol Stats</p>
                      <p className="font-bold italic italic">Node Network Active</p>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest">Total Sourced</p>
                  <p className="text-5xl font-bold tracking-tighter italic tabular-nums">{products.length}<span className="text-xs opacity-30 ml-2 italic">Units</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest">Protocol Fee</p>
                  <p className="text-5xl font-bold tracking-tighter italic text-forest dark:text-harvest tabular-nums">0<span className="text-xs opacity-30 ml-2 italic">%</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-muted p-5 rounded-[2rem] border border-border italic">
                 <ShieldCheck className="text-harvest" size={24} />
                 <p className="text-xs font-semibold leading-relaxed opacity-60">Immutable smart contracts secure every asset acquisition.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-12">
          <div className="flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-2xl bg-forest dark:bg-harvest text-white flex items-center justify-center shadow-lg"><Globe size={20} /></div>
             <h2 className="text-3xl font-bold italic tracking-tighter">Global Acquisitions<span className="text-harvest">.</span></h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="aspect-[3/4] bg-card animate-pulse rounded-[3rem] border border-border"></div>
              ))}
            </div>
          ) : sortedGlobal.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-[4rem] border-2 border-dashed border-border">
               <Package size={64} className="text-stone/20 mx-auto mb-4" />
               <p className="text-stone/40 font-bold italic">No external nodes found in this sector.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {sortedGlobal.map((p) => (
                <ProductCard key={p.id} p={p} userLocation={userLocation} rates={rates} sortByNearby={sortByNearby} getDistance={getDistance} />
              ))}
            </div>
          )}
        </section>

        {user && myProducts.length > 0 && (
          <section className="mt-32 space-y-12 pt-16 border-t border-border/50">
            <div className="flex items-center gap-4 px-2">
               <div className="w-10 h-10 rounded-2xl bg-muted text-harvest flex items-center justify-center border border-border shadow-inner"><User size={20} /></div>
               <h2 className="text-3xl font-bold italic tracking-tighter">Your Active Nodes<span className="text-harvest">.</span></h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 opacity-70 hover:opacity-100 transition-opacity">
              {myProducts.map((p) => (
                <ProductCard key={p.id} p={p} userLocation={userLocation} rates={rates} sortByNearby={sortByNearby} getDistance={getDistance} isMine />
              ))}
            </div>
          </section>
        )}
      </main>

      <Link href={user ? "/dashboard" : "/login"}>
        <Button className="md:hidden fixed bottom-8 right-8 w-16 h-16 rounded-3xl bg-forest dark:bg-harvest text-white shadow-2xl z-[110] p-0 active:scale-90 transition-transform">
          {user ? <LayoutDashboard size={28} /> : <LogIn size={28} />}
        </Button>
      </Link>
    </div>
  )
}

function ProductCard({ p, userLocation, rates, sortByNearby, getDistance, isMine = false }) {
  return (
    <Link href={`/marketplace/${p.id}`} className="group">
      <Card className="border-none shadow-none bg-transparent hover:-translate-y-2 transition-all duration-500">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden mb-6 bg-card border border-border shadow-sm group-hover:shadow-2xl">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <Badge className="bg-background/80 backdrop-blur-md text-foreground font-bold px-3 py-1.5 rounded-2xl text-[9px] border border-border uppercase tracking-widest italic">
                {p.category}
              </Badge>
              {isMine && <Badge className="bg-forest text-white px-3 py-1.5 rounded-2xl text-[9px] uppercase font-black italic">My Node</Badge>}
              {sortByNearby && userLocation && !isMine && (
                <Badge className="bg-harvest text-white font-bold px-3 py-1.5 rounded-2xl text-[9px] italic border-none shadow-lg">
                  {getDistance(userLocation.lat, userLocation.lng, p.profiles?.latitude, p.profiles?.longitude)?.toFixed(1)} KM
                </Badge>
              )}
            </div>
            
            {p.image_url ? (
              <img src={p.image_url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={p.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted opacity-20">
                <ShieldCheck size={120} strokeWidth={0.5} />
              </div>
            )}

            <div className="absolute bottom-6 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <div className="w-12 h-12 bg-forest dark:bg-harvest text-white rounded-2xl flex items-center justify-center shadow-2xl">
                <ArrowRight size={24} />
              </div>
            </div>
          </div>

          <div className="px-3 space-y-4 text-left">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-harvest" />
                  <span className="text-[10px] font-bold text-stone/40 uppercase tracking-tight italic">{p.profiles?.location?.split(',')[0]}</span>
               </div>
               <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-xl border border-border">
                  <Star size={10} className="fill-harvest text-harvest" />
                  <span className="text-[10px] font-black text-foreground">{p.profiles?.reputation_score}%</span>
               </div>
            </div>

            <h3 className="font-bold text-lg md:text-xl group-hover:text-harvest transition-colors line-clamp-1 italic tracking-tight leading-none lowercase">
              {p.name}<span className="text-harvest">.</span>
            </h3>

            <div className="pt-4 border-t border-border flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone/30 uppercase tracking-[0.2em] leading-none italic">Asset Value</p>
                <div className="flex items-center gap-1 text-forest dark:text-harvest">
                   <Coins size={14} />
                   <p className="text-2xl font-bold tracking-tighter tabular-nums leading-none">
                     {p.price_per_kg}
                   </p>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-stone/40 italic">≈ ${(p.price_per_kg * (rates?.ethToUsd || 0)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
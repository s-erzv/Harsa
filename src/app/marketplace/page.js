"use client"
import React, { useState, useEffect } from 'react'
import { 
  Search, Filter, MapPin, ShieldCheck, Leaf, LayoutDashboard,
  ArrowRight, Loader2, Star, Check, Package, LogIn, Globe, 
  Navigation, Heart, Zap, Sparkles, Activity, Layers
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getEthPrice } from '@/utils/blockchain' 

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Marketplace() {
  const { supabase, user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [userLocation, setUserLocation] = useState(null)
  const [sortByNearby, setSortByNearby] = useState(false)

  const categories = ['All Categories', 'Rice', 'Vegetables', 'Fruits', 'Spices', 'Others']

  useEffect(() => {
    fetchProducts()
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    }
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, reputation_score, location, latitude, longitude, wallet_address)')
      .order('created_at', { ascending: false })
    
    if (!error) setProducts(data || [])
    setLoading(false)
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

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const catToMatch = selectedCategory === 'All Categories' ? 'All' : selectedCategory
      const matchesCategory = catToMatch === 'All' || p.category === catToMatch
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortByNearby && userLocation) {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.profiles?.latitude, a.profiles?.longitude) || Infinity
        const distB = getDistance(userLocation.lat, userLocation.lng, b.profiles?.latitude, b.profiles?.longitude) || Infinity
        return distA - distB
      }
      return 0
    })

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-raleway pb-24 text-left selection:bg-forest selection:text-white">
      
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-clay/20 z-[100] transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/light.png" alt="Harsa" className="h-9 w-auto transition-transform group-hover:rotate-6" />
            <span className="text-xl font-bold text-forest italic leading-none">Harsa</span>
          </Link>
          
          <div className="flex items-center gap-3"> 
            <Button 
              variant="outline"
              onClick={() => setSortByNearby(!sortByNearby)}
              className={`rounded-2xl h-10 px-4 text-[11px] font-bold transition-all gap-2 ${sortByNearby ? 'bg-harvest text-white border-none shadow-lg' : 'border-clay/60 text-stone'}`}
            >
              <Navigation size={14} className={sortByNearby ? "animate-pulse" : ""} /> 
              <span className="hidden xs:block">{sortByNearby ? 'Nearby Enabled' : 'Find Nearby'}</span>
            </Button>

            {user ? (
              <Link href="/dashboard">
                <Button className="rounded-2xl bg-forest hover:bg-forest/90 h-10 px-5 gap-2 text-[11px] font-bold shadow-xl shadow-forest/20 active:scale-95">
                  <LayoutDashboard size={14} /> <span className="hidden sm:block">My Account</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="rounded-2xl text-forest h-10 px-5 text-[11px] font-bold hover:bg-chalk">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 md:pt-48 max-w-7xl mx-auto px-6 md:px-10">
        
        <header className="mb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 py-2 px-4 rounded-full bg-forest text-chalk text-[10px] font-bold border border-white/10 shadow-lg">
              <Sparkles size={12} className="text-harvest" /> Real-time Market Access
            </div>
            <h1 className="text-7xl md:text-8xl font-bold text-stone leading-[1] tracking-tighter italic">
              Source <br/> <span className="text-forest decoration-clay/40">Premium</span> <br/> <span className="text-stone-300">Harvests.</span>
            </h1>
            <p className="text-stone/60 text-lg font-medium italic border-l-4 border-clay pl-6 max-w-lg leading-relaxed">
              Browse authentic products directly from local farmers. Every purchase is protected by our secure smart contract system.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/30 group-focus-within:text-forest transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search for rice, veggies, or farmers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-3xl bg-white border border-clay/20 focus:ring-4 focus:ring-forest/5 outline-none transition-all text-sm font-semibold italic text-forest shadow-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-3xl h-14 px-8 border-clay text-stone font-bold text-xs gap-3 hover:bg-white shadow-sm">
                    <Filter size={18} className="text-harvest" /> {selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 font-raleway border-clay bg-white shadow-2xl">
                  {categories.map((cat) => (
                    <DropdownMenuItem 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xl px-4 py-3 text-[11px] font-bold flex justify-between cursor-pointer mb-1 ${selectedCategory === cat ? 'bg-forest text-white' : 'text-stone hover:bg-chalk'}`}
                    >
                      {cat}
                      {selectedCategory === cat && <Check size={14} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="hidden lg:block relative group transform rotate-2 hover:rotate-0 transition-all duration-700">
            <div className="absolute inset-0 bg-forest/5 rounded-[3rem] blur-2xl opacity-50" />
            <div className="relative bg-white border-2 border-clay rounded-[3rem] p-10 shadow-2xl space-y-8">
              <div className="flex justify-between items-center border-b border-chalk pb-6">
                <div className="flex items-center gap-3">
                   <Layers className="text-forest" size={20} />
                   <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest leading-none">Network Status</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-forest leading-none">ACTIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-chalk/40 p-5 rounded-[1.5rem] border border-clay/10">
                  <p className="text-[9px] font-semibold text-stone/40 uppercase mb-2">Available Crops</p>
                  <p className="text-3xl font-bold text-forest tracking-tighter leading-none">{products.length}</p>
                </div>
                <div className="bg-chalk/40 p-5 rounded-[1.5rem] border border-clay/10">
                  <p className="text-[9px] font-semibold text-stone/40 uppercase mb-2">Platform Fee</p>
                  <p className="text-3xl font-bold text-forest tracking-tighter leading-none">0%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-forest text-chalk p-4 rounded-2xl shadow-xl">
                 <ShieldCheck className="text-harvest" size={20} />
                 <p className="text-xs font-semibold italic">Safe Escrow: Your funds are protected until delivery.</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-[2.5rem] border border-clay/10"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-clay/30">
             <Package size={60} strokeWidth={1} className="text-clay mx-auto mb-4" />
             <h3 className="text-2xl font-bold text-forest italic">No products found</h3>
             <p className="text-stone/40 text-sm mt-1">Try adjusting your filters or search terms.</p>
             <Button variant="link" onClick={() => {setSearchTerm(''); setSelectedCategory('All Categories')}} className="text-harvest text-xs font-bold uppercase mt-4">Reset Search</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((p) => (
              <Link href={`/marketplace/${p.id}`} key={p.id} className="group">
                <Card className="border-none shadow-none bg-transparent overflow-visible">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-5 bg-white border border-clay/10 transition-all duration-500 group-hover:shadow-[0_40px_80px_-20px_rgba(27,67,50,0.12)] group-hover:-translate-y-2">
                      
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                        <Badge className="bg-white/90 backdrop-blur-md text-forest font-bold px-3 py-1 rounded-xl text-[9px] border-none shadow-sm">
                          {p.category}
                        </Badge>
                        {sortByNearby && userLocation && (
                          <Badge className="bg-harvest text-white font-bold px-3 py-1 rounded-xl text-[8px] italic border-none shadow-lg">
                            {getDistance(userLocation.lat, userLocation.lng, p.profiles?.latitude, p.profiles?.longitude)?.toFixed(1)} KM Away
                          </Badge>
                        )}
                      </div>

                      {/* <button className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-forest hover:bg-white hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                        <Heart size={16} />
                      </button> */}
                      
                      {p.image_url ? (
                        <img src={p.image_url} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={p.name} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-5">
                          <ShieldCheck size={180} strokeWidth={1} className="text-forest" />
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4">
                        <div className="w-10 h-10 bg-forest text-white rounded-2xl flex items-center justify-center shadow-2xl transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>

                    <div className="px-2 space-y-3">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-harvest" />
                            <span className="text-[10px] font-semibold text-stone/40 italic truncate max-w-[100px]">{p.profiles?.location?.split(',')[0]}</span>
                         </div>
                         <div className="flex items-center gap-1 bg-chalk/50 px-2 py-0.5 rounded-lg border border-clay/10">
                            <Star size={10} className="fill-harvest text-harvest" />
                            <span className="text-[10px] font-bold text-forest">{p.profiles?.reputation_score}% Trust</span>
                         </div>
                      </div>

                      <h3 className="font-bold text-stone text-base md:text-lg group-hover:text-forest transition-colors line-clamp-1 italic leading-tight">
                        {p.name}
                      </h3>

                      <div className="flex items-end justify-between pt-2 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-semibold text-stone/30 mb-0.5 italic">Price</span>
                          <p className="text-forest font-bold text-xl tabular-nums leading-none">
                            ${p.price_per_kg?.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-stone/30 italic">/ per KG</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Link href={user ? "/dashboard" : "/login"}>
        <Button className="md:hidden fixed bottom-8 right-8 w-16 h-16 rounded-[2rem] bg-forest text-white shadow-[0_30px_60px_rgba(27,67,50,0.5)] z-[110] p-0 active:scale-90 transition-transform flex items-center justify-center">
          {user ? <LayoutDashboard size={28} /> : <LogIn size={28} />}
        </Button>
      </Link>
    </div>
  )
}
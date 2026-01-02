"use client"
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  ShoppingCart, Search, Filter, MapPin, 
  ShieldCheck, Plus, Leaf, LayoutDashboard,
  ArrowRight, X, Trash2, ShoppingBag, Loader2,
  Star, Check, Package
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const categories = ['Semua', 'Beras', 'Sayuran', 'Buah', 'Rempah', 'Lainnya']

  useEffect(() => {
    const fetchAllProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, profiles(full_name, reputation_score)')
        .order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    fetchAllProducts()
    
    const savedCart = localStorage.getItem('harsa_cart')
    if (savedCart) setCart(JSON.parse(savedCart))
  }, [supabase])

  useEffect(() => {
    localStorage.setItem('harsa_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price_per_kg * item.quantity), 0)

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-white font-raleway"> 
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-stone-100 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Leaf size={20} className="text-chalk" />
            </div>
            <span className="text-xl font-bold text-forest tracking-tighter uppercase">harsa pasar</span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hidden md:flex gap-2 text-stone hover:text-forest font-bold">
                <LayoutDashboard size={18} /> Panel Kontrol
              </Button>
            </Link>

            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <div className="relative p-3 bg-chalk rounded-2xl cursor-pointer group hover:bg-clay/20 transition-all">
                  <ShoppingCart size={22} className="text-forest" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-harvest text-forest text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white animate-in zoom-in">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                  )}
                </div>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md rounded-l-lg border-clay bg-white flex flex-col font-raleway">
                <SheetHeader className="pb-6 border-b border-stone-100">
                  <SheetTitle className="text-2xl font-bold text-forest flex items-center gap-3">
                    <ShoppingBag /> Keranjang Belanja
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-6 space-y-4 no-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone opacity-40 italic">
                      <ShoppingCart size={48} className="mb-4" />
                      <p>Keranjang Anda masih kosong</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 rounded-3xl bg-chalk/50 border border-stone-50 group">
                        <div className="w-20 h-20 bg-clay/30 rounded-2xl flex items-center justify-center shrink-0">
                          <Package className="text-forest/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-harvest uppercase tracking-widest">{item.category}</p>
                          <h4 className="font-bold text-forest truncate">{item.name}</h4>
                          <p className="text-xs text-stone font-medium">Rp {item.price_per_kg.toLocaleString()} x {item.quantity}kg</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-stone/40 hover:text-red-500 self-center transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <SheetFooter className="pt-6 border-t border-stone-100 block space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-stone text-sm font-medium uppercase tracking-widest">Total Estimasi</span>
                      <span className="text-2xl font-bold text-forest tabular-nums">Rp {cartTotal.toLocaleString()}</span>
                    </div>
                    <Button className="w-full bg-forest hover:bg-forest/90 text-chalk h-14 rounded-2xl font-bold text-base shadow-xl shadow-forest/20">
                      Lanjutkan Checkout
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 md:px-8">
        <header className="mb-16">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="bg-clay/50 text-forest font-bold mb-4 px-4 py-1.5 rounded-full border-none">
              #RantaiPasokTerpercaya
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-forest mb-8 leading-[1.1] tracking-tight">
              Dapatkan hasil bumi <span className="italic text-harvest underline decoration-clay underline-offset-8">langsung</span> dari sumbernya.
            </h1>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/40 group-focus-within:text-forest transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Cari Beras, Sayur, atau Buah..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-3xl bg-chalk border border-stone-100 focus:bg-white focus:ring-4 focus:ring-forest/5 outline-none transition-all text-sm font-medium"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="px-10 py-8 bg-forest hover:bg-forest/90 text-white rounded-3xl font-bold text-sm shadow-xl shadow-forest/20 gap-3">
                    <Filter size={18} /> {selectedCategory === 'Semua' ? 'Kategori' : selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 font-raleway border-clay bg-white">
                  {categories.map((cat) => (
                    <DropdownMenuItem 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xl px-4 py-3 text-sm font-bold flex justify-between cursor-pointer ${selectedCategory === cat ? 'bg-forest text-white' : 'text-stone hover:bg-chalk'}`}
                    >
                      {cat}
                      {selectedCategory === cat && <Check size={16} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="space-y-4">
                <div className="aspect-square bg-chalk animate-pulse rounded-[2.5rem]"></div>
                <div className="h-4 w-2/3 bg-chalk animate-pulse rounded-full"></div>
                <div className="h-6 w-1/2 bg-chalk animate-pulse rounded-full"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-6 bg-chalk rounded-full">
              <Search size={40} className="text-stone/20" />
            </div>
            <h3 className="text-xl font-bold text-forest">Produk Tidak Ditemukan</h3>
            <p className="text-stone max-w-xs mx-auto">Kami tidak dapat menemukan hasil bumi yang sesuai dengan pencarian Anda.</p>
            <Button variant="link" onClick={() => {setSearchTerm(''); setSelectedCategory('Semua')}} className="text-harvest font-bold">
              Atur Ulang Pencarian
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-y-16 animate-in fade-in duration-500">
            {filteredProducts.map((p) => (
              <Card key={p.id} className="group border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/5] bg-chalk rounded-[2.5rem] overflow-hidden mb-6 border border-stone-50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-forest/10 group-hover:-translate-y-2">
                    <Badge className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur text-forest font-bold px-4 py-1.5 rounded-xl border-none shadow-sm">
                      {p.category}
                    </Badge>
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                      <ShieldCheck size={160} strokeWidth={1} className="text-forest" />
                    </div>

                    <div className="absolute bottom-6 inset-x-6 z-10 flex justify-between items-end">
                      <div className="space-y-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                         <Badge className="bg-forest text-chalk border-none font-bold">
                           Stok {p.stock_kg} kg
                         </Badge>
                      </div>
                      <button 
                        onClick={() => addToCart(p)}
                        className="w-14 h-14 bg-forest text-chalk rounded-2xl flex items-center justify-center shadow-xl shadow-forest/20 hover:bg-forest/90 active:scale-90 transition-all"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="px-2 space-y-3"> 
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-harvest" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-stone/60">
                          {p.profiles?.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-harvest text-harvest" />
                        <span className="text-[11px] font-bold text-stone">
                          {p.profiles?.reputation_score || 100}
                        </span>
                      </div>
                    </div>
                    
                    <Link href={`/marketplace/${p.id}`}>
                      <h3 className="font-bold text-forest text-xl mb-1 hover:text-harvest transition-colors line-clamp-1 italic tracking-tight">
                        {p.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-end justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone uppercase tracking-widest">Harga / Kg</span>
                        <p className="text-forest font-bold text-2xl tracking-tighter">
                          Rp{p.price_per_kg?.toLocaleString()}
                        </p>
                      </div>
                      <Link href={`/marketplace/${p.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full text-stone hover:text-forest group/btn">
                          Detail <ArrowRight size={14} className="ml-1 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Link href="/dashboard">
        <Button className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-forest text-chalk shadow-2xl z-[60] p-0">
          <LayoutDashboard size={24} />
        </Button>
      </Link>
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ChatWindow from '@/components/ChatWindow'
import ThemeToggle from '@/components/ThemeToggle'
import BlockchainActivity from '@/components/BlockchainActivity'
import { 
  ShieldCheck, Star, Package, MapPin, 
  Loader2, ArrowLeft, ShoppingBag, 
  MessageSquare, Info, X, Activity,
  TrendingUp, Globe, Wallet
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function PetaniProfile() {
  const { id } = useParams()
  const router = useRouter()
  const { user, supabase } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const fetchPetaniData = async () => {
      try {
        const [profRes, revRes, prodRes, txCount, actData] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('reviews')
            .select(`*, buyer:profiles!reviews_buyer_id_fkey (full_name, avatar_url)`)
            .eq('seller_id', id)
            .order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('seller_id', id),
          supabase.from('transactions').select('id', { count: 'exact' }).eq('seller_id', id).eq('status', 'COMPLETE'),
          supabase.from('transactions')
            .select(`*, buyer:buyer_id(wallet_address), seller:seller_id(wallet_address)`)
            .eq('seller_id', id)
            .order('created_at', { ascending: false })
            .limit(10)
        ])
        
        setProfile({ ...profRes.data, total_COMPLETE_tx: txCount.count || 0 })
        setReviews(revRes.data || [])
        setProducts(prodRes.data || [])
        setActivities(actData.data || [])
      } catch (err) { 
        console.error("Error fetching data:", err) 
      } finally { 
        setLoading(false) 
      }
    }
    if (id) fetchPetaniData()
  }, [id, supabase])

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest" size={40} />
      <p className="mt-4 text-stone/40 text-[10px] font-bold tracking-[0.3em] animate-pulse italic">Establishing node connection...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground font-raleway pb-24 transition-colors duration-500">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 md:h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 group text-stone hover:text-harvest transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-xs md:text-sm">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Badge variant="outline" className="hidden sm:flex border-harvest/30 text-harvest bg-harvest/5 rounded-full px-3 py-1 gap-1.5 font-bold text-[10px] tracking-widest">
               Producer Node
            </Badge>
          </div>
        </div>
      </nav>

      <header className="relative bg-forest dark:bg-harvest/10 pt-12 pb-32 md:pb-40 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute -top-24 -right-24 text-white/5 dark:text-harvest/5 rotate-12">
          <ShieldCheck size={480} strokeWidth={1} />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center md:items-start md:flex-row gap-8 md:gap-12">
          <div className="relative group">
            <div className="w-32 h-32 md:w-44 md:h-44 bg-card rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-forest dark:text-harvest text-6xl font-bold shadow-2xl border-4 border-border overflow-hidden transition-transform duration-700 group-hover:scale-105">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
              ) : (
                profile?.full_name?.charAt(0)
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-harvest text-white p-3 rounded-2xl shadow-xl border-4 border-background group-hover:rotate-12 transition-transform">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="text-center md:text-left space-y-4 md:pt-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-7xl font-bold italic tracking-tighter leading-none text-white dark:text-harvest">
                {profile?.full_name}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-white/50 dark:text-harvest/50 font-mono text-xs">
                <Wallet size={14} />
                <span>{profile?.wallet_address ? `${profile.wallet_address.slice(0,6)}...${profile.wallet_address.slice(-4)}` : 'Node not linked'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white dark:text-harvest px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest">
                <Star size={12} className="text-harvest fill-harvest mr-2" />
                Reputation {profile?.reputation_score}
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-emerald-100/70 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest italic">
                <MapPin size={12} className="text-harvest mr-2" />
                {profile?.location || 'Unknown Node'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 -mt-20 relative z-20 space-y-10 md:space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            <section className="bg-card p-8 md:p-12 rounded-[2.5rem] border border-border shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-harvest/10 rounded-lg text-harvest"><Info size={18} /></div>
                <h2 className="text-xs font-bold text-stone/40 tracking-[0.2em]">Node Identity & Vision</h2>
              </div>
              <p className="text-foreground text-xl md:text-2xl font-medium leading-relaxed italic text-left">
                "{profile?.bio || 'Initializing digital legacy at Harsa Network. Cultivating transparency through decentralized infrastructure.'}"
              </p>
            </section>

            <section className="space-y-8">
               <BlockchainActivity activities={activities} />
            </section>

            <section className="bg-card p-8 md:p-12 rounded-[2.5rem] border border-border shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-harvest/10 rounded-lg text-harvest"><MessageSquare size={18} /></div>
                  <h2 className="text-2xl font-bold italic tracking-tight">Node Testimonials</h2>
                </div>
                <span className="text-[10px] font-bold text-stone/30 tracking-widest">{reviews.length} total</span>
              </div>

              <div className="space-y-8">
                {reviews.length > 0 ? reviews.map((r) => (
                  <div key={r.id} className="group pb-8 border-b border-border last:border-0 text-left">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center font-bold text-foreground text-sm overflow-hidden border border-border">
                          {r.buyer?.avatar_url ? (
                            <img src={r.buyer.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            r.buyer?.full_name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-base">{r.buyer?.full_name}</p>
                          <div className="flex gap-0.5 mt-1 text-harvest">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? "fill-current" : "text-stone/20"} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-stone/40 tracking-widest mt-2">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-stone dark:text-stone-400 text-sm leading-relaxed italic pl-16">"{r.comment}"</p>
                  </div>
                )) : (
                  <div className="text-center py-16 opacity-30">
                    <MessageSquare size={48} className="mx-auto mb-4" />
                    <p className="text-sm italic font-medium">No verified reviews recorded on-chain.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <aside className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl md:sticky md:top-28 space-y-10">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-muted rounded-2xl text-harvest border border-border shadow-inner">
                      <Package size={20}/>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-stone/40 tracking-widest leading-none mb-1">Catalog</p>
                       <p className="text-sm font-bold tracking-tight">Active SKUs</p>
                    </div>
                  </div>
                  <span className="text-4xl font-bold italic text-foreground tabular-nums tracking-tighter">{products.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-muted rounded-2xl text-forest dark:text-emerald-500 border border-border shadow-inner">
                      <TrendingUp size={20}/>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-stone/40 tracking-widest leading-none mb-1">Performance</p>
                       <p className="text-sm font-bold tracking-tight">Fulfilled Orders</p>
                    </div>
                  </div>
                  <span className="text-4xl font-bold italic text-foreground tabular-nums tracking-tighter">{profile?.total_COMPLETE_tx || 0}</span>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                {user?.id !== id && (
                  <Button 
                    onClick={() => setIsChatOpen(true)}
                    variant="outline"
                    className="w-full h-16 rounded-2xl border-harvest text-harvest font-bold text-xs tracking-widest hover:bg-harvest/5 transition-all"
                  >
                    <MessageSquare size={18} className="mr-2" /> Encrypted Message
                  </Button>
                )}

                <Link href="/marketplace" className="block">
                  <Button className="w-full h-16 rounded-2xl bg-forest dark:bg-harvest text-white font-bold text-xs tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                    <Globe size={18} className="mr-2" /> Explore Harvest
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 opacity-20 text-[9px] font-bold tracking-[0.3em]">
                 <ShieldCheck size={12} /> Harsa Verified Producer
              </div>
            </aside>
          </div>

        </div>
      </main>

      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-background/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full md:max-w-2xl h-full md:h-[70vh] shadow-2xl rounded-none md:rounded-[3rem] overflow-hidden border-none md:border border-border bg-card flex flex-col">
            <div className="flex md:hidden p-4 border-b border-border items-center justify-between bg-card">
               <span className="font-bold text-sm italic">Chat with {profile?.full_name?.split(' ')[0]}</span>
               <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-stone"><X size={20} /></button>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hidden md:flex absolute top-6 right-6 z-[110] w-12 h-12 bg-background border border-border rounded-2xl items-center justify-center text-stone hover:text-red-500 transition-all active:scale-90"><X size={24} /></button>
            <div className="flex-1 overflow-hidden">
               <ChatWindow receiverId={id} receiverName={profile?.full_name} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
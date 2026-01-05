"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  ShieldCheck, Star, Package, MapPin, 
  Loader2, ArrowLeft, Languages, 
  ShoppingBag, MessageSquare, Info 
} from 'lucide-react'
import Link from 'next/link'

export default function PetaniProfile() {
  const { id } = useParams()
  const router = useRouter()
  const { supabase } = useAuth()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('id')

  const t = {
    id: { 
      back: "Kembali ke Pasar", 
      reviews: "Ulasan Komunitas", 
      stats: "Statistik Petani", 
      total_tx: "Transaksi Sukses", 
      items: "Katalog Produk", 
      empty_rev: "Belum ada ulasan dari pembeli.", 
      loc: "Wilayah Distribusi",
      buy_btn: "Lihat Hasil Panen",
      about: "Tentang Petani"
    },
    en: { 
      back: "Back to Market", 
      reviews: "Community Reviews", 
      stats: "Farmer Statistics", 
      total_tx: "Successful Sales", 
      items: "Product Catalog", 
      empty_rev: "No buyer reviews yet.", 
      loc: "Distribution Area",
      buy_btn: "View Harvest Results",
      about: "About Farmer"
    }
  }
  const content = lang === 'id' ? t.id : t.en

  useEffect(() => {
    const fetchPetaniData = async () => {
      try {
        const [profRes, revRes, prodRes, txCount] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('reviews')
            .select(`
              *,
              buyer:profiles!reviews_buyer_id_fkey (
                full_name,
                avatar_url
              )
            `)
            .eq('seller_id', id)
            .order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('seller_id', id),
          supabase.from('transactions').select('id', { count: 'exact' }).eq('seller_id', id).eq('status', 'COMPLETED')
        ])
        
        setProfile({ ...profRes.data, total_completed_tx: txCount.count || 0 })
        setReviews(revRes.data || [])
        setProducts(prodRes.data || [])
      } catch (err) { 
        console.error("Error fetching data:", err) 
      } finally { 
        setLoading(false) 
      }
    }
    if (id) fetchPetaniData()
  }, [id, supabase])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="mt-4 text-stone text-xs font-bold uppercase tracking-widest italic">Memuat Profil Petani...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white font-raleway pb-32">
      <header className="bg-forest text-white pt-12 pb-44 px-6 rounded-b-[3.5rem] md:rounded-b-[5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none rotate-12 translate-x-1/4 -translate-y-1/4">
          <ShieldCheck size={500} strokeWidth={1} />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-12">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-emerald-100/60 text-xs font-bold uppercase tracking-widest hover:text-white transition group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {content.back}
            </button>
            <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-tighter hover:bg-white/20 transition-all">
              {lang.toUpperCase()}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            <div className="relative">
              <div className="w-32 h-32 md:w-44 md:h-44 bg-white rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-forest text-5xl font-bold shadow-2xl border-4 border-white/20 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
                ) : (
                  profile?.full_name?.charAt(0)
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-harvest p-2.5 rounded-2xl shadow-lg border-4 border-forest">
                <ShieldCheck size={24} className="text-forest" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-4">
              <h1 className="text-4xl md:text-7xl font-bold italic tracking-tighter leading-none">{profile?.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                  <Star size={14} className="text-harvest fill-harvest" />
                  <span className="text-xs font-bold uppercase tracking-widest">Reputasi: {profile?.reputation_score}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-100/60 text-xs font-bold">
                  <MapPin size={14} className="text-harvest" /> {profile?.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 -mt-28 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-clay shadow-xl shadow-stone-200/30">
              <h2 className="text-[10px] font-bold text-stone uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Info size={14} className="text-harvest" /> {content.about}
              </h2>
              <p className="text-forest text-xl md:text-2xl font-medium leading-relaxed italic">
                "{profile?.bio || 'Membangun masa depan tani yang lebih transparan dan adil bersama Harsa.'}"
              </p>
            </section>

            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-clay shadow-sm">
              <h2 className="text-2xl font-bold text-forest italic mb-10 flex items-center gap-3">
                <MessageSquare className="text-harvest" /> {content.reviews}
              </h2>
              <div className="space-y-8">
                {reviews.length > 0 ? reviews.map((r) => (
                  <div key={r.id} className="group pb-8 border-b border-clay/30 last:border-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-chalk flex items-center justify-center font-bold text-forest text-sm overflow-hidden border border-clay/50">
                          {r.buyer?.avatar_url ? (
                            <img src={r.buyer.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            r.buyer?.full_name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-forest text-base">{r.buyer?.full_name}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? "fill-harvest text-harvest" : "text-stone/20"} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-stone/40 uppercase tracking-widest mt-2">
                        {new Date(r.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-stone/80 text-sm leading-relaxed italic pl-16">"{r.comment}"</p>
                  </div>
                )) : (
                  <div className="text-center py-16">
                    <MessageSquare size={48} className="mx-auto text-stone/10 mb-4" />
                    <p className="text-stone/40 text-sm italic font-medium">{content.empty_rev}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <aside className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm sticky top-28">
              <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-8 border-b border-clay pb-4">
                {content.stats}
              </p>
              <div className="space-y-10">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-chalk rounded-2xl text-forest group-hover:scale-110 transition-transform shadow-inner">
                      <Package size={20}/>
                    </div>
                    <span className="text-xs font-bold text-stone uppercase tracking-tighter leading-tight">{content.items}</span>
                  </div>
                  <span className="text-3xl font-bold text-forest tabular-nums italic">{products.length}</span>
                </div>

                <div className="flex justify-between items-center group text-left">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-chalk rounded-2xl text-forest group-hover:scale-110 transition-transform shadow-inner">
                      <ShoppingBag size={20}/>
                    </div>
                    <span className="text-xs font-bold text-stone uppercase tracking-tighter leading-tight">{content.total_tx}</span>
                  </div>
                  <span className="text-3xl font-bold text-forest tabular-nums italic">{profile?.total_completed_tx || 0}</span>
                </div>

                <div className="pt-6">
                  <Link href="/marketplace">
                    <button className="w-full bg-forest text-white py-5 rounded-[1.75rem] font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-forest/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                      <ShoppingBag size={18} /> {content.buy_btn}
                    </button>
                  </Link>
                </div>
              </div>
            </aside>
          </div>

        </div>
      </main>
    </div>
  )
}
"use client"
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  MapPin, Loader2, Navigation, AlertTriangle, 
  CheckCircle2, Edit3, Check, Info, Map as MapIcon,
  Box, Globe, ShieldCheck, ArrowRight
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import ThemeToggle from '@/components/ThemeToggle'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function GuestTrackingPage({ params }) {
  const [tx, setTx] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [coords, setCoords] = useState({ lat: null, lng: null })
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  
  const autocompleteRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const p = await params
      if (p?.id) fetchData(p.id)
    }
    init()
  }, [params])

  const fetchData = async (trackingNum) => {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, buyer:profiles!transactions_buyer_id_fkey(*), product:products(*)')
      .eq('tracking_number', trackingNum)
      .maybeSingle()

    if (transaction) {
      setTx(transaction)
      const { data: updates } = await supabase
        .from('shipping_updates')
        .select('*')
        .eq('transaction_id', transaction.id)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (updates?.length > 0) setLastUpdate(updates[0])
      startLocationDetection()
    } else {
      setError("Tracking node not found.")
      setLoading(false)
    }
  }

  const startLocationDetection = () => {
    if (!navigator.geolocation) {
      setIsEditing(true)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const checkGoogle = setInterval(() => {
          if (window.google) {
            clearInterval(checkGoogle)
            reverseGeocode(latitude, longitude)
            setLoading(false)
          }
        }, 500)
      },
      () => {
        setIsEditing(true)
        setLoading(false)
      }
    )
  }

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setCoords({ lat, lng })
        setAddress(results[0].formatted_address)
        const cityComp = results[0].address_components.find(c => c.types.includes('administrative_area_level_2'))
        setCity(cityComp ? cityComp.long_name : "Transit Node")
      }
    })
  }

  useEffect(() => {
    if (isEditing && inputRef.current && window.google) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode']
      })
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace()
        if (place.geometry) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          setCoords({ lat, lng })
          setAddress(place.formatted_address)
          const cityComp = place.address_components.find(c => c.types.includes('administrative_area_level_2'))
          setCity(cityComp ? cityComp.long_name : "Transit Point")
        }
      })
    }
  }, [isEditing])

  const handleSubmit = async () => {
    if (!coords.lat || !coords.lng) return
    setUpdating(true)
    const toastId = toast.loading("Syncing logistics node...")

    try {
      const { error } = await supabase.from('shipping_updates').insert({
        transaction_id: tx.id,
        location: city,
        latitude: coords.lat,
        longitude: coords.lng,
        status_description: `Package in transit: ${city}`
      })

      if (error) throw error

      if (tx.status === 'AWAITING_DELIVERY') {
        await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', tx.id)
      }
      
      setSuccess(true)
      toast.success("Transit data secured", { id: toastId })
    } catch (err) {
      toast.error("Failed to update node", { id: toastId })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse italic">Establishing Node Connection...</p>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-raleway flex items-center justify-center p-4 md:p-8 transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-lg rounded-[2.5rem] border-2 border-border shadow-2xl overflow-hidden bg-card transition-all duration-500">
        <div className="bg-forest dark:bg-harvest/10 p-8 md:p-12 text-white dark:text-harvest relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <Globe size={240} />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[10px] font-bold tracking-widest uppercase">Live Dispatch Node</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold italic tracking-tighter uppercase">{tx?.tracking_number}</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Global Logistics Protocol</p>
          </div>
        </div>

        <CardContent className="p-6 md:p-10 space-y-8">
          {success ? (
            <div className="text-center py-12 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-emerald-500" size={40} />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter italic italic">Synced!</h2>
              <p className="text-stone/50 text-sm mt-3 font-medium leading-relaxed">
                Logistics node has been updated.<br/>Please proceed to the next transit point.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-8 rounded-2xl border-border px-8 font-bold italic h-12"
              >
                Refresh Console
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-3xl border border-border">
                   <p className="text-[9px] font-bold text-stone/40 uppercase mb-1">Asset</p>
                   <p className="text-xs font-bold truncate italic">{tx?.product?.name || "Premium Commodity"}</p>
                </div>
                <div className="bg-muted p-4 rounded-3xl border border-border">
                   <p className="text-[9px] font-bold text-stone/40 uppercase mb-1">Quantity</p>
                   <p className="text-xs font-bold italic">{tx?.amount_kg} kg Asset</p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 px-1">
                 <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <Box size={18} className="text-stone/40" />
                 </div>
                 <ArrowRight size={16} className="text-stone/20" />
                 <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest leading-none mb-1">Final Destination</p>
                    <p className="text-sm font-bold truncate italic">{tx?.buyer?.location}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone/40 uppercase tracking-widest flex items-center gap-2">
                      <Navigation size={12} className="text-harvest" /> Current Transit Point
                    </label>
                  </div>
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="text-[10px] font-bold text-harvest hover:underline decoration-2 underline-offset-4 uppercase tracking-widest"
                  >
                    {isEditing ? 'Cancel' : 'Manual Entry'}
                  </button>
                </div>
                
                <div className={`transition-all duration-500 ${isEditing ? 'bg-muted rounded-3xl p-2' : ''}`}>
                  {isEditing ? (
                    <input 
                      ref={inputRef}
                      type="text"
                      placeholder="Search hub or city node..."
                      className="w-full px-6 py-5 rounded-2xl bg-card border-2 border-harvest/30 text-sm outline-none focus:ring-4 focus:ring-harvest/5 italic font-bold placeholder:font-normal placeholder:opacity-30"
                    />
                  ) : (
                    <div className="p-6 bg-muted rounded-[2rem] border-2 border-border flex gap-5 items-center shadow-inner group">
                      <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm shrink-0">
                         <MapPin className="text-harvest group-hover:scale-110 transition-transform" size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight italic truncate">
                          {address || (error ? "Node Access Required" : "Detecting GPS Node...")}
                        </p>
                        <p className="text-[10px] font-bold text-stone/40 uppercase mt-1">Verified Location</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={updating || !address} 
                  className="w-full bg-forest dark:bg-harvest text-white rounded-[2rem] h-20 font-bold uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-forest/20 disabled:opacity-20"
                >
                  {updating ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-3"><ShieldCheck size={20} /> Authorize Transit</span>}
                </Button>

                <div className="flex items-center gap-2 justify-center opacity-30 text-[9px] font-bold uppercase tracking-widest text-stone">
                  <ShieldCheck size={12} /> Encrypted Logistics Node
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  MapPin, Loader2, Navigation, AlertTriangle, 
  CheckCircle2, Edit3, Check, Info, Map as MapIcon
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
      .select('*, buyer:profiles!transactions_buyer_id_fkey(*)')
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
      setError("Tracking number not found in Harsa network.")
      setLoading(false)
    }
  }

  const startLocationDetection = () => {
    if (!navigator.geolocation) {
      setError("GPS not supported. Use manual search.")
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
        setError("GPS access denied. Please search manually.")
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
        setCity(cityComp ? cityComp.long_name : "Transit Point")
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

    if (lastUpdate && 
        parseFloat(lastUpdate.latitude).toFixed(5) === coords.lat.toFixed(5) && 
        parseFloat(lastUpdate.longitude).toFixed(5) === coords.lng.toFixed(5)) {
      alert("Thank you. This location is already up to date. Please continue delivery.")
      return
    }

    setUpdating(true)
    
    if (tx.buyer?.latitude && tx.buyer?.longitude) {
      const dist = calculateDistance(coords.lat, coords.lng, tx.buyer.latitude, tx.buyer.longitude)
      if (dist > 3) {
        const proceed = confirm(`Warning: You are ${dist.toFixed(1)}km away from the final destination. Is this correct?`)
        if (!proceed) { setUpdating(false); return; }
      }
    }

    const { error } = await supabase.from('shipping_updates').insert({
      transaction_id: tx.id,
      location: city,
      latitude: coords.lat,
      longitude: coords.lng,
      status_description: `Package transit at: ${address}`
    })

    if (!error) {
      if (tx.status === 'AWAITING_DELIVERY') {
        await supabase.from('transactions').update({ status: 'SHIPPED' }).eq('id', tx.id)
      }
      setSuccess(true)
    }
    setUpdating(false)
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold uppercase tracking-widest animate-pulse">Establishing Node Connection...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 font-raleway p-6 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
        <div className="bg-forest p-10 text-white text-center relative">
          <div className="absolute top-0 right-0 opacity-10 -rotate-12 translate-x-4 -translate-y-4">
            <MapIcon size={150} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-60 font-bold mb-1">Transit Confirmation</p>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">{tx?.tracking_number}</h1>
          </div>
        </div>

        <CardContent className="p-8">
          {success ? (
            <div className="text-center py-10 animate-in zoom-in">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={56} />
              <h2 className="text-2xl font-bold text-forest uppercase italic leading-none">Logged!</h2>
              <p className="text-stone text-[10px] font-bold uppercase mt-4 tracking-widest italic leading-relaxed">
                Logistics node updated successfully.<br/>Please proceed with the delivery.
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest flex items-center gap-1">
                    <Navigation size={10} /> Current Transit Point
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="h-6 text-harvest gap-1 text-[10px] font-bold hover:bg-harvest/5 transition-all uppercase">
                    <Edit3 size={12}/> {isEditing ? 'Cancel' : 'Manual Search'}
                  </Button>
                </div>
                
                {isEditing ? (
                  <div className="relative">
                    <input 
                      ref={inputRef}
                      type="text"
                      placeholder="Search hub, city, or address..."
                      className="w-full px-5 py-4 rounded-2xl bg-chalk border border-clay/20 text-xs outline-none focus:ring-4 focus:ring-forest/5 placeholder:opacity-50"
                    />
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4 items-start shadow-inner">
                    <MapPin className="text-harvest shrink-0 mt-1" size={20} />
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                      {address || (error ? "Location access required" : "Detecting GPS Node...")}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-chalk/50 p-4 rounded-2xl border border-clay/10">
                  <p className="text-[9px] font-bold text-stone uppercase mb-1 opacity-50">Item Info</p>
                  <p className="text-xs font-bold text-forest truncate italic uppercase tracking-tighter">{tx?.product?.name}</p>
                </div>
                <div className="bg-chalk/50 p-4 rounded-2xl border border-clay/10">
                  <p className="text-[9px] font-bold text-stone uppercase mb-1 opacity-50">Destination</p>
                  <p className="text-xs font-bold text-forest truncate italic uppercase tracking-tighter">{tx?.buyer?.location}</p>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={updating || !address} 
                className="w-full bg-forest text-white rounded-[2rem] h-20 font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all shadow-forest/20 disabled:opacity-30"
              >
                {updating ? <Loader2 className="animate-spin" /> : <><Check size={20} className="mr-2" /> Sync Transit Data</>}
              </Button>

              <div className="flex items-center gap-2 justify-center opacity-30 text-[9px] font-bold uppercase tracking-widest text-stone">
                <Info size={12} /> Secure Logistics Node
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
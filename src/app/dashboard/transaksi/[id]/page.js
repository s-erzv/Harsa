"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  ShieldCheck, ArrowLeft, Download, ExternalLink, Loader2, 
  Cpu, QrCode, Printer, MapPin, Truck, Navigation, Clock, Map as MapIcon
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from 'qrcode.react'
import Script from 'next/script'

export default function DetailTransaksiPage() {
  const { id } = useParams()
  const router = useRouter()
  const { supabase, user } = useAuth()
  const [tx, setTx] = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRLabel, setShowQRLabel] = useState(false)
  
  const mapRef = useRef(null)
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => { if (id) fetchDetail() }, [id])

  const fetchDetail = async () => {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *, 
        product:products(name), 
        seller:profiles!transactions_seller_id_fkey(id, full_name, location, latitude, longitude), 
        buyer:profiles!transactions_buyer_id_fkey(id, full_name, location, latitude, longitude)
      `)
      .eq('id', id).single()
    
    const { data: updateLogs } = await supabase
      .from('shipping_updates')
      .select('*')
      .eq('transaction_id', id)
      .order('created_at', { ascending: true })

    setTx(data)
    setUpdates(updateLogs || [])
    setLoading(false)
  }

  useEffect(() => {
    if (googleReady && tx && mapRef.current && tx.seller?.latitude && tx.buyer?.latitude) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: Number(tx.seller.latitude), lng: Number(tx.seller.longitude) },
        zoom: 7,
        styles: mapStyle,
        disableDefaultUI: true,
      })

      const bounds = new window.google.maps.LatLngBounds()

      const sellerPos = { lat: Number(tx.seller.latitude), lng: Number(tx.seller.longitude) }
      new window.google.maps.Marker({
        position: sellerPos,
        map,
        label: { text: "🏠", fontSize: "16px" },
        title: "Seller (Origin)"
      })
      bounds.extend(sellerPos)

      const buyerPos = { lat: Number(tx.buyer.latitude), lng: Number(tx.buyer.longitude) }
      new window.google.maps.Marker({
        position: buyerPos,
        map,
        label: { text: "🏁", fontSize: "18px" },
        title: "Buyer (Destination)"
      })
      bounds.extend(buyerPos)

      const routePath = [sellerPos]

      updates.forEach((update) => {
        if (update.latitude && update.longitude) {
          const point = { lat: Number(update.latitude), lng: Number(update.longitude) }
          routePath.push(point)
          bounds.extend(point)
        }
      })

      const polyline = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#22493A",
        strokeOpacity: 0.6,
        strokeWeight: 4,
        map: map
      })

      if (updates.length > 0) {
        const lastUpdate = updates[updates.length - 1]
        if (lastUpdate.latitude && lastUpdate.longitude) {
          new window.google.maps.Marker({
            position: { lat: Number(lastUpdate.latitude), lng: Number(lastUpdate.longitude) },
            map,
            label: { text: "🚚", fontSize: "24px" },
            icon: { url: "" }
          })
        }
      }

      map.fitBounds(bounds)
    }
  }, [googleReady, tx, updates])

  const isSeller = user?.id === tx?.seller_id;
  const formatUSD = (val) => (val / 15600).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  if (loading || !tx) return (
    <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-forest" size={40} /></div>
  )

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 bg-white min-h-screen font-raleway pb-24 text-left">
      <Script 
        id="google-maps-loader"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
        onLoad={() => setGoogleReady(true)}
      />

      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 p-0 text-stone hover:text-forest transition-all">
          <ArrowLeft size={18}/> Go back
        </Button>
        {isSeller && (
           <Button onClick={() => setShowQRLabel(!showQRLabel)} variant="outline" className="rounded-xl border-clay/30 gap-2 text-forest font-bold text-xs tracking-widest">
              <QrCode size={16}/> {showQRLabel ? 'Hide Label' : 'Shipping Label'}
           </Button>
        )}
      </div>

      {showQRLabel && isSeller && (
        <div id="shipping-label" className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white border-2 border-dashed border-clay/40 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-inner">
              <QRCodeSVG 
                value={`${window.location.origin}/track/${tx.tracking_number}`} 
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <Badge className="bg-harvest text-white text-[9px] tracking-widest px-3 py-1">Node Transaction ID</Badge>
              <h2 className="text-2xl font-black text-forest uppercase">{tx.tracking_number}</h2>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-bold tracking-widest">
                <div><p className="opacity-50 mb-1">From</p><p className="text-forest truncate">{tx.seller?.full_name}</p></div>
                <div><p className="opacity-50 mb-1">To</p><p className="text-forest truncate">{tx.buyer?.full_name}</p></div>
              </div>
              <Button onClick={() => window.print()} className="bg-slate-900 text-white rounded-xl gap-2 h-10 px-6 text-[10px] font-bold tracking-widest mt-2 print:hidden">
                <Printer size={14}/> Print Label
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-[450px] rounded-[3rem] bg-slate-100 mb-8 overflow-hidden shadow-inner border border-slate-200 relative">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md p-5 rounded-[2rem] border border-slate-200 shadow-2xl max-w-xs">
           <div className="text-[10px] font-bold text-forest tracking-widest mb-2 flex items-center gap-2">
             <div className="w-2 h-2 bg-harvest rounded-full animate-ping" /> Global Logistics Node
           </div>
           <p className="text-xs font-bold text-slate-700 leading-relaxed">
             {updates.length > 0 
               ? `Currently transit at: ${updates[updates.length-1].location}` 
               : 'Package is being prepared for dispatch.'}
           </p>
           <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[9px] font-bold text-stone/40 tracking-widest">Tracking Status</p>
              <Badge className="bg-forest/10 text-forest text-[9px] border-none uppercase">{tx.status}</Badge>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-slate-50/50 p-8 md:p-10 rounded-[3rem] border border-slate-100">
              <h3 className="text-sm font-bold text-forest mb-8 flex items-center gap-2 tracking-tighter">
                <Navigation size={16} className="text-harvest" /> Real-time Logistics Ledger
              </h3>
              <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {[...updates].reverse().map((update, idx) => (
                  <div key={update.id} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-harvest animate-pulse' : 'bg-slate-300'}`} />
                    <p className="text-[9px] font-bold text-stone/40 mb-1">{new Date(update.created_at).toLocaleString('en-US')}</p>
                    <p className="text-sm font-bold text-forest tracking-tight">{update.location}</p>
                    <p className="text-xs text-stone/60 leading-relaxed">{update.status_description}</p>
                  </div>
                ))}
                <div className="relative opacity-50">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white bg-slate-200" />
                  <p className="text-xs font-bold text-stone tracking-tighter">Origin: {tx.seller?.location}</p>
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-8 bg-forest rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
              <Cpu className="absolute -right-6 -bottom-6 text-white/5" size={150} />
              <p className="text-[10px] font-bold tracking-widest opacity-60 mb-2">Blockchain Value</p>
              <p className="text-3xl font-bold tracking-tighter mb-4">{formatUSD(tx.total_price)}</p>
              <a href={`https://polygonscan.com/tx/${tx.tx_hash}`} target="_blank" className="text-[9px] font-mono opacity-40 hover:opacity-100 flex items-center gap-2 truncate transition-all">
                <ExternalLink size={10} /> {tx.tx_hash}
              </a>
           </div>

           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center group transition-all hover:bg-white hover:shadow-xl">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                 <Truck className="text-harvest" size={32} />
              </div>
              <p className="text-[10px] font-bold text-stone tracking-[0.2em] mb-1">Current status</p>
              <p className="text-lg font-bold text-forest leading-none">{tx.status.replace('_', ' ')}</p>
           </div>
        </div>
      </div>
    </div>
  )
}

const mapStyle = [
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }] },
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }, { "lightness": 17 }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#ffffff" }, { "lightness": 29 }, { "weight": 0.2 }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }, { "lightness": 21 }] },
  { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#fefefe" }, { "lightness": 20 }] }
];
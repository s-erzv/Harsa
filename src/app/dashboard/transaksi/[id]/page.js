"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  ShieldCheck, ArrowLeft, Download, ExternalLink, Loader2, 
  Cpu, QrCode, Printer, MapPin, Truck, Navigation, Clock,
  Home, Flag, Box, Globe, ChevronRight, Check
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from 'qrcode.react'
import Script from 'next/script'
import { toast } from 'sonner'
import { getMarketRates } from '@/utils/blockchain'

export default function DetailTransaksiPage() {
  const { id } = useParams()
  const router = useRouter()
  const { supabase, user } = useAuth()
  const [tx, setTx] = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRLabel, setShowQRLabel] = useState(false)
  const [rates, setRates] = useState(null)
  
  const mapRef = useRef(null)
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => { 
    if (id) {
      fetchDetail()
      loadRates()
    }
  }, [id])

  const loadRates = async () => {
    const data = await getMarketRates()
    setRates(data)
  }

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

      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#1B4332",
          strokeOpacity: 0.5,
          strokeWeight: 4
        }
      });

      const origin = { lat: Number(tx.seller.latitude), lng: Number(tx.seller.longitude) };
      const destination = { lat: Number(tx.buyer.latitude), lng: Number(tx.buyer.longitude) };
      const waypoints = updates
        .filter(u => u.latitude && u.longitude)
        .map(u => ({
          location: { lat: Number(u.latitude), lng: Number(u.longitude) },
          stopover: true
        }));

      directionsService.route({
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        }
      });

      // Pake Emoticon Markers biar lebih puitis & simple
      const createCustomMarker = (pos, content) => {
        const overlay = document.createElement('div');
        overlay.innerHTML = `<div style="font-size: 24px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1))">${content}</div>`;
        return new window.google.maps.OverlayView(); // Placeholder logic for simplified markers
      };

      // Native Markers with Emoticons via Label
      new window.google.maps.Marker({
        position: origin,
        map,
        label: { text: "🏠", fontSize: "24px" },
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 } // Hide default
      });

      new window.google.maps.Marker({
        position: destination,
        map,
        label: { text: "🏁", fontSize: "24px" },
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }
      });

      if (updates.length > 0) {
        const last = updates[updates.length - 1];
        new window.google.maps.Marker({
          position: { lat: Number(last.latitude), lng: Number(last.longitude) },
          map,
          label: { text: "🚚", fontSize: "30px" },
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }
        });
      }
    }
  }, [googleReady, tx, updates])

  const isSeller = user?.id === tx?.seller_id;
  const ethToUsdValue = rates ? (tx?.total_price * rates.ethToUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "...";

  if (loading || !tx) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse italic">Accessing Ledger Node...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-background text-foreground min-h-screen font-raleway pb-32 text-left transition-colors duration-500">
      <Script 
        id="google-maps-loader"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
        onLoad={() => setGoogleReady(true)}
      />

      <div className="flex justify-between items-center mb-8 px-2 animate-in fade-in duration-700">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-stone hover:text-harvest transition-all group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-xs uppercase tracking-widest">Back</span>
        </button>
        {isSeller && (
          <Button onClick={() => setShowQRLabel(!showQRLabel)} variant="outline" className="rounded-2xl border-harvest/30 gap-2 text-harvest font-black text-[10px] uppercase tracking-widest h-11 px-5">
            <QrCode size={16}/> {showQRLabel ? 'Close Label' : 'Shipping Label'}
          </Button>
        )}
      </div>

      {showQRLabel && isSeller && (
        <div id="shipping-label" className="mb-10 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-card border-2 border-dashed border-harvest/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-10 shadow-xl">
            <div className="p-4 bg-white rounded-3xl border border-border">
              <QRCodeSVG value={`${window.location.origin}/track/${tx.tracking_number}`} size={150} level="H" includeMargin={true} />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <Badge className="bg-harvest text-white uppercase text-[9px] tracking-widest font-black px-4 py-1.5 rounded-full">Manifest Authority</Badge>
              <h2 className="text-3xl font-bold tracking-tighter italic leading-none">{tx.tracking_number}</h2>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest pt-2 opacity-60 italic">
                <div><p>Source Node: {tx.seller?.full_name}</p></div>
                <div><p>Target Node: {tx.buyer?.full_name}</p></div>
              </div>
              <Button onClick={() => window.print()} className="bg-foreground text-background rounded-xl gap-2 h-10 px-8 text-[10px] font-bold uppercase tracking-widest mt-2 print:hidden shadow-lg">
                <Printer size={14}/> Print Manifest
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAN MAP CONSOLE */}
      <div className="w-full h-[450px] md:h-[550px] rounded-[3rem] bg-card mb-10 overflow-hidden shadow-2xl border border-border relative">
        <div ref={mapRef} className="w-full h-full" />
        
        <div className="absolute top-6 left-6 right-6 md:right-auto md:w-80 bg-white/90 dark:bg-card/90 backdrop-blur-md p-6 rounded-[2.5rem] border border-border shadow-2xl z-20">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-forest dark:text-harvest uppercase font-bold text-[9px] tracking-widest">
                 <div className="w-1.5 h-1.5 rounded-full bg-harvest animate-pulse" /> Live Route
              </div>
              <Badge className="bg-muted text-foreground text-[8px] font-black uppercase px-2 py-0.5">{tx.status}</Badge>
           </div>
           <p className="text-xs font-bold leading-relaxed italic text-stone">
             {updates.length > 0 
               ? `Transit authorized: ${updates[updates.length-1].location}` 
               : 'Awaiting dispatch confirmation.'}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-card p-8 md:p-12 rounded-[3rem] border border-border shadow-sm text-left">
              <h3 className="text-sm font-bold text-harvest uppercase italic mb-10 flex items-center gap-3">
                <Navigation size={18} /> Node Delivery Logs
              </h3>
              
              <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/50">
                {[...updates].reverse().map((update, idx) => (
                  <div key={update.id} className="relative">
                    <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-card shadow-sm ${idx === 0 ? 'bg-harvest animate-pulse' : 'bg-border'}`} />
                    <p className="text-[9px] font-bold text-stone/30 uppercase mb-1 tracking-widest">{new Date(update.created_at).toLocaleString()}</p>
                    <h4 className="text-base font-bold italic uppercase tracking-tight">{update.location}</h4>
                    <p className="text-xs text-stone/50 font-medium italic leading-relaxed">{update.status_description}</p>
                  </div>
                ))}
                <div className="relative opacity-30">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-card bg-border" />
                  <p className="text-xs font-bold italic uppercase tracking-tighter">Origin: {tx.seller?.location}</p>
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="p-8 bg-forest dark:bg-harvest/10 rounded-[2.5rem] text-white dark:text-harvest relative overflow-hidden shadow-2xl border border-white/5 text-left">
              <Cpu className="absolute -right-6 -bottom-6 text-white/5" size={120} />
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Contract Settlement</p>
                  <h4 className="text-3xl font-bold tracking-tighter italic tabular-nums leading-none">Ξ {tx.total_price}</h4>
                  <p className="text-base font-bold opacity-30 italic">≈ {ethToUsdValue}</p>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <a href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash}`} target="_blank" className="flex items-center justify-between group">
                     <span className="text-[9px] font-mono opacity-50 truncate mr-4">TX: {tx.tx_hash}</span>
                     <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 transition-all" />
                   </a>
                </div>
              </div>
           </div>

           <div className="p-8 bg-card rounded-[2.5rem] border border-border flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center border border-border">
                 <Truck className="text-harvest" size={24} />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest leading-none">Protocol State</p>
                 <p className="text-lg font-bold italic uppercase tracking-tight">{tx.status.replace('_', ' ')}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

const mapStyle = [
  { "featureType": "water", "stylers": [{ "color": "#e9e9e9" }] },
  { "featureType": "landscape", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
];
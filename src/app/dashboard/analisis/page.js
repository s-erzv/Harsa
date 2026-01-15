"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts'
import { 
  TrendingUp, Package, ShoppingBag, 
  ArrowUpRight, Loader2, Calendar, Users, 
  Activity, MapPin, Navigation, Coins, Globe, Layers,
  ShieldCheck, ArrowRight
} from 'lucide-react'
import { getMarketRates } from '@/utils/blockchain'
import { Badge } from '@/components/ui/badge'

export default function SalesAnalytics() {
  const { user, supabase } = useAuth()
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [productMix, setProductMix] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [customerLocations, setCustomerLocations] = useState([])
  const [rates, setRates] = useState(null)
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalVolume: 0,
    avgOrderValue: 0
  })

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const [txRes, marketRates] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            *, 
            product:products(name), 
            buyer:profiles!transactions_buyer_id_fkey(full_name, location)
          `)
          .eq('seller_id', user.id)
          .eq('status', 'COMPLETE')
          .order('created_at', { ascending: true }),
        getMarketRates()
      ])

      if (txRes.error) throw txRes.error
      const data = txRes.data
      setRates(marketRates)

      const dailyMap = data.reduce((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        acc[date] = (acc[date] || 0) + curr.total_price
        return acc
      }, {})

      const chartData = Object.keys(dailyMap).map(date => ({
        name: date,
        revenue: dailyMap[date]
      }))

      const productMap = data.reduce((acc, curr) => {
        const name = curr.product?.name || 'Unknown'
        acc[name] = (acc[name] || 0) + curr.amount_kg
        return acc
      }, {})

      const pieData = Object.keys(productMap).map(name => ({
        name,
        value: productMap[name]
      }))

      const customerMap = data.reduce((acc, curr) => {
        const name = curr.buyer?.full_name || 'Guest'
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})

      const customerData = Object.keys(customerMap)
        .map(name => ({ name, count: customerMap[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      const locationMap = data.reduce((acc, curr) => {
        const loc = curr.buyer?.location?.split(',')[0] || 'Unknown Node'
        acc[loc] = (acc[loc] || 0) + 1
        return acc
      }, {})

      const locationData = Object.keys(locationMap)
        .map(loc => ({ name: loc, count: locationMap[loc] }))
        .sort((a, b) => b.count - a.count)

      const totalRev = data.reduce((sum, tx) => sum + tx.total_price, 0)
      const totalVol = data.reduce((sum, tx) => sum + tx.amount_kg, 0)

      setSummary({
        totalRevenue: totalRev,
        totalOrders: data.length,
        totalVolume: totalVol,
        avgOrderValue: data.length > 0 ? totalRev / data.length : 0
      })

      setSalesData(chartData)
      setProductMix(pieData)
      setTopCustomers(customerData)
      setCustomerLocations(locationData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#D4A373', '#1B4332', '#64748B', '#FAEDCD'];

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-stone/40 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse italic">Parsing Node Intelligence...</p>
    </div>
  )

  const ethToUsdValue = (eth) => eth * (rates?.ethToUsd || 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32 font-raleway text-left transition-colors duration-500 bg-background text-foreground">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter italic leading-none">Node Insights<span className="text-harvest">.</span></h1>
          <p className="text-stone/40 text-sm font-medium italic">Deep analysis of your cryptographic trade pipeline.</p>
        </div>
        <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-[1.5rem] border border-border shadow-sm">
          <Calendar size={16} className="text-harvest" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Genesis to Date</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Settled Value" 
          value={`Ξ ${summary.totalRevenue.toFixed(4)}`} 
          subValue={`≈ $${ethToUsdValue(summary.totalRevenue).toLocaleString()}`}
          icon={<Coins size={20} className="text-harvest" />}
          trend="Growth Active"
        />
        <StatCard 
          label="Acquisitions" 
          value={`${summary.totalOrders}`} 
          subValue="Verified Nodes"
          icon={<Layers size={20} className="text-harvest" />}
        />
        <StatCard 
          label="Asset Flow" 
          value={`${summary.totalVolume} kg`} 
          subValue="Harvest Volume"
          icon={<Package size={20} className="text-harvest" />}
        />
        <StatCard 
          label="Mean Node Value" 
          value={`Ξ ${summary.avgOrderValue.toFixed(4)}`} 
          subValue={`≈ $${ethToUsdValue(summary.avgOrderValue).toFixed(2)}`}
          icon={<Activity size={20} className="text-harvest" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 bg-card p-8 md:p-12 rounded-[3.5rem] border border-border shadow-xl space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
             <TrendingUp size={300} />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-[10px] font-bold text-harvest uppercase tracking-[0.3em]">Value Transmission Trend (ETH)</h3>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-tighter">Live Protocol Sync</Badge>
          </div>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A373" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D4A373" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: 'rgba(120,120,120,0.5)'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: '1px solid rgba(120,120,120,0.2)', backgroundColor: 'rgba(20,20,20,0.8)', backdropBlur: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 900, color: '#D4A373' }}
                  formatter={(value) => [`Ξ ${value.toFixed(4)}`, 'Node Value']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4A373" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-card p-10 rounded-[3.5rem] border border-border shadow-xl space-y-10 flex flex-col justify-center">
          <h3 className="text-[10px] font-bold text-harvest uppercase tracking-[0.3em] text-center">Asset Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productMix}
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {productMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {productMix.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="opacity-40 italic">{p.name}</span>
                </div>
                <span className="text-foreground">{p.value} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-xl space-y-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[10px] font-bold text-harvest uppercase tracking-[0.3em]">Node Geography</h3>
              <p className="text-xs text-stone/40 italic font-medium mt-1">Cross-border asset allocation.</p>
            </div>
            <Globe size={24} className="text-harvest opacity-20" />
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerLocations} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120,120,120,0.1)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(120,120,120,0.5)', italic: true}}
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(120,120,120,0.05)'}}
                  contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#1B4332', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#1B4332" radius={[0, 15, 15, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-muted p-12 rounded-[4rem] border-2 border-dashed border-border flex flex-col justify-center space-y-8 relative overflow-hidden group">
          <Navigation size={180} className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000" />
          <div className="w-16 h-16 bg-card rounded-3xl border border-border flex items-center justify-center shadow-xl">
            <Navigation size={28} className="text-harvest" />
          </div>
          <div className="space-y-4">
             <h4 className="text-2xl font-bold italic tracking-tighter lowercase">Protocol Expansion Plan<span className="text-harvest">.</span></h4>
             <p className="text-sm text-stone/60 leading-relaxed font-medium">
               Your strongest logistics node is currently active in <span className="font-bold text-foreground tracking-widest uppercase">{customerLocations[0]?.name || 'Detecting...'}</span>. 
               Optimizing your Arbitrum L2 gas fees for this route could yield a 12.4% increase in net node settlement.
             </p>
          </div>
          <div className="pt-6 border-t border-border flex items-center gap-4">
             <div className="px-4 py-2 rounded-xl bg-card border border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-harvest">Active Corridors: {customerLocations.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-forest dark:bg-harvest/10 rounded-[4rem] p-12 text-white dark:text-harvest relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 transition-transform duration-1000">
           <Users size={300} />
        </div>
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
              <ShieldCheck size={28} className="text-white dark:text-harvest" />
            </div>
            <div className="text-left">
              <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-50">Consensus Partners</h3>
              <p className="text-3xl font-bold tracking-tighter italic">Top Merchant Connections</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topCustomers.map((c, i) => (
              <div key={i} className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6 hover:bg-white/10 transition-all shadow-xl group/card">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black italic">#{i+1}</div>
                   <Badge className="bg-emerald-400 text-forest font-black border-none text-[8px] px-3 uppercase tracking-tighter">Verified Node</Badge>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-lg font-bold truncate italic tracking-tight uppercase">{c.name}</p>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Global Identity Link</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                   <div>
                      <p className="text-2xl font-bold tabular-nums tracking-tighter">{c.count}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Orders Settled</p>
                   </div>
                   <ArrowRight size={20} className="opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-2 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, subValue, icon, trend }) {
  return (
    <div className="bg-card p-8 rounded-[3rem] border-2 border-border shadow-sm hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
      <div className="absolute inset-0 bg-harvest/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="p-4 bg-muted rounded-2xl border border-border shadow-inner group-hover:scale-110 transition-transform duration-500">{icon}</div>
        {trend && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-black text-emerald-500 tracking-[0.2em] uppercase italic">{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1 relative z-10 text-left">
        <p className="text-[10px] font-bold text-stone/40 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-bold tracking-tighter tabular-nums text-foreground italic">{value}</p>
        <p className="text-[11px] font-bold text-stone/30 italic uppercase">{subValue}</p>
      </div>
    </div>
  )
}
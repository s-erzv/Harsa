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
  Activity, Star, MapPin, Navigation
} from 'lucide-react'

export default function SalesAnalytics() {
  const { user, supabase } = useAuth()
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [productMix, setProductMix] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [customerLocations, setCustomerLocations] = useState([]) // State baru
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
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *, 
          product:products(name), 
          buyer:profiles!transactions_buyer_id_fkey(full_name, location)
        `)
        .eq('seller_id', user.id)
        .eq('status', 'COMPLETE')
        .order('created_at', { ascending: true })

      if (error) throw error

      // 1. Revenue Trend Logic
      const dailyMap = data.reduce((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        acc[date] = (acc[date] || 0) + curr.total_price
        return acc
      }, {})

      const chartData = Object.keys(dailyMap).map(date => ({
        name: date,
        revenue: dailyMap[date]
      }))

      // 2. Product Mix Logic
      const productMap = data.reduce((acc, curr) => {
        const name = curr.product?.name || 'Unknown'
        acc[name] = (acc[name] || 0) + curr.amount_kg
        return acc
      }, {})

      const pieData = Object.keys(productMap).map(name => ({
        name,
        value: productMap[name]
      }))

      // 3. Top Customers Logic
      const customerMap = data.reduce((acc, curr) => {
        const name = curr.buyer?.full_name || 'Guest'
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})

      const customerData = Object.keys(customerMap)
        .map(name => ({ name, count: customerMap[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      // 4. Geographic Distribution Logic (NEW)
      const locationMap = data.reduce((acc, curr) => {
        const loc = curr.buyer?.location || 'Unknown Node'
        acc[loc] = (acc[loc] || 0) + 1
        return acc
      }, {})

      const locationData = Object.keys(locationMap)
        .map(loc => ({ name: loc, count: locationMap[loc] }))
        .sort((a, b) => b.count - a.count)

      // 5. Summary Calculations
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

  const COLORS = ['#1B4332', '#D4A373', '#64748B', '#FAEDCD'];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-10 pb-32 font-raleway text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest tracking-tighter">Business Insights</h1>
          <p className="text-stone text-sm mt-1 font-medium lowercase">Deep dive into your farm's global trade performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-chalk px-4 py-2 rounded-xl border border-clay">
          <Calendar size={14} className="text-forest" />
          <span className="text-[10px] font-bold text-forest tracking-widest">Lifetime Data</span>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`$${summary.totalRevenue.toLocaleString('en-US')}`} 
          icon={<Activity size={20} className="text-forest" />}
          trend="Growth"
        />
        <StatCard 
          label="Orders Done" 
          value={`${summary.totalOrders}`} 
          icon={<ShoppingBag size={20} className="text-forest" />}
        />
        <StatCard 
          label="Volume Sold" 
          value={`${summary.totalVolume} kg`} 
          icon={<Package size={20} className="text-forest" />}
        />
        <StatCard 
          label="Avg. Order" 
          value={`$${summary.avgOrderValue.toFixed(2)}`} 
          icon={<TrendingUp size={20} className="text-forest" />}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-forest tracking-[0.2em]">Revenue Trend (USD)</h3>
            <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px]">Live Data</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748B'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 800, color: '#1B4332' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1B4332" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm space-y-8">
          <h3 className="text-[10px] font-bold text-forest tracking-[0.2em]">Harvest Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productMix}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
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
              <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-stone lowercase">{p.name}</span>
                </div>
                <span className="text-forest tracking-tighter">{p.value} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Distribution Section (NEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[10px] font-bold text-forest tracking-[0.2em]">Geographic Demand</h3>
              <p className="text-xs text-stone lowercase">Where your harvests landed.</p>
            </div>
            <MapPin size={18} className="text-forest opacity-20" />
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerLocations} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#64748B'}}
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#1B4332" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-clay/10 p-8 rounded-[2.5rem] border border-dashed border-clay flex flex-col justify-center space-y-6">
          <div className="p-4 bg-white rounded-3xl w-fit shadow-sm">
            <Navigation size={24} className="text-forest" />
          </div>
          <h4 className="text-xl font-bold text-forest tracking-tight">Expansion Strategy</h4>
          <p className="text-sm text-stone leading-relaxed">
            Your strongest market node is currently in <span className="font-bold text-forest tracking-widest">{customerLocations[0]?.name || '...'}</span>. 
            Data suggests optimizing your logistics pipeline for this route could increase your net margin by up to 12%.
          </p>
          <div className="pt-4 border-t border-clay/30">
            <p className="text-[10px] font-bold text-forest tracking-widest">Active Corridors: {customerLocations.length}</p>
          </div>
        </div>
      </div>

      {/* Loyalty Insights */}
      <div className="bg-forest rounded-[2.5rem] p-10 text-chalk relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Star size={180} className="rotate-12" />
        </div>
        <div className="relative z-10 space-y-8 text-left">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <Users size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-clay/60">Loyalty Insights</h3>
              <p className="text-xl font-bold tracking-tight">Your Top Purchasing Partners</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCustomers.length > 0 ? topCustomers.map((c, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex justify-between items-center transition-all hover:bg-white/10">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-emerald-400 mb-1">Rank #{i+1}</p>
                  <p className="text-sm font-bold truncate">{c.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tracking-tighter">{c.count}</p>
                  <p className="text-[8px] font-bold text-clay/40">Orders</p>
                </div>
              </div>
            )) : (
              <p className="text-xs opacity-40">Awaiting your first loyal partner...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-chalk rounded-2xl group-hover:bg-forest group-hover:text-chalk transition-colors duration-500">{icon}</div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
            <ArrowUpRight size={10} className="text-emerald-600" />
            <span className="text-[8px] font-black text-emerald-600 tracking-widest">{trend}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold text-stone tracking-[0.2em] mb-2">{label}</p>
      <p className="text-2xl font-bold text-forest tracking-tighter tabular-nums">{value}</p>
    </div>
  )
}

function Badge({ children, className }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${className}`}>
      {children}
    </span>
  )
}
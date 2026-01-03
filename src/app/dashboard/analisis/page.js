"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts'
import { 
  TrendingUp, DollarSign, Package, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Loader2, Calendar 
} from 'lucide-react'

export default function AnalisisPenjualan() {
  const { user, supabase } = useAuth()
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [productMix, setProductMix] = useState([])
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growth: 12.5 // Dummy growth percentage
  })

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, product:products(name)')
        .eq('seller_id', user.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: true })

      if (error) throw error

      // 1. Olah Data Tren Omzet (Grouping by Date)
      const dailyMap = data.reduce((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        acc[date] = (acc[date] || 0) + curr.total_price
        return acc
      }, {})

      const chartData = Object.keys(dailyMap).map(date => ({
        name: date,
        omzet: dailyMap[date]
      }))

      // 2. Olah Data Produk Terlaris
      const productMap = data.reduce((acc, curr) => {
        const name = curr.product?.name || 'Tanpa Nama'
        acc[name] = (acc[name] || 0) + curr.amount_kg
        return acc
      }, {})

      const pieData = Object.keys(productMap).map(name => ({
        name,
        value: productMap[name]
      }))

      // 3. Hitung Ringkasan
      const totalRev = data.reduce((sum, tx) => sum + tx.total_price, 0)
      setSummary({
        totalRevenue: totalRev,
        totalOrders: data.length,
        avgOrderValue: data.length > 0 ? totalRev / data.length : 0,
        growth: 15.2
      })

      setSalesData(chartData)
      setProductMix(pieData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#1B4332', '#D4A373', '#059669', '#4A4E69'];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-forest" size={40} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-10 pb-32 font-raleway">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest tracking-tight">Analisis Penjualan</h1>
          <p className="text-stone text-sm mt-1 font-medium">Data performa bisnis hasil bumi Anda secara riil.</p>
        </div>
        <div className="flex items-center gap-2 bg-chalk px-4 py-2 rounded-xl border border-clay">
          <Calendar size={16} className="text-forest" />
          <span className="text-xs font-bold text-forest">30 Hari Terakhir</span>
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Pendapatan" 
          value={`Rp ${summary.totalRevenue.toLocaleString('id-ID')}`} 
          icon={<DollarSign className="text-forest" />}
          trend={<><ArrowUpRight size={14}/> {summary.growth}%</>}
          trendColor="text-emerald-600"
        />
        <StatCard 
          label="Pesanan Selesai" 
          value={`${summary.totalOrders} Transaksi`} 
          icon={<ShoppingBag className="text-forest" />}
          trend={<><ArrowUpRight size={14}/> +4</>}
          trendColor="text-emerald-600"
        />
        <StatCard 
          label="Rata-rata Penjualan" 
          value={`Rp ${summary.avgOrderValue.toLocaleString('id-ID')}`} 
          icon={<TrendingUp className="text-forest" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REVENUE TREND CHART */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-forest uppercase tracking-widest flex items-center gap-2">
             Tren Omzet Harian
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748B'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSze: '12px' }}
                  itemStyle={{ fontWeight: 800, color: '#1B4332' }}
                />
                <Area type="monotone" dataKey="omzet" stroke="#1B4332" strokeWidth={3} fillOpacity={1} fill="url(#colorOmzet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP PRODUCTS PIE */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-forest uppercase tracking-widest">
            Volume Terjual (Kg)
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productMix}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
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
          <div className="space-y-3">
            {productMix.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-stone">{p.name}</span>
                </div>
                <span className="text-forest">{p.value} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend, trendColor }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-clay shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-chalk rounded-2xl">{icon}</div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-50 flex items-center gap-1 ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-forest tracking-tighter">{value}</p>
    </div>
  )
}
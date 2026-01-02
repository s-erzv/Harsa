"use client"
import React, { useState } from 'react'
import { 
  LayoutDashboard, Package, TrendingUp, 
  User, LogOut, X, ShoppingBag, Menu as MenuIcon,
  ShieldCheck, Settings, HelpCircle, Bell,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar({ logout }) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) 
  
  const mainItems = [
    { icon: <LayoutDashboard size={22}/>, label: "Beranda", path: "/dashboard" },
    { icon: <Package size={22}/>, label: "Produk", path: "/dashboard/produk" },
    { icon: <ShoppingBag size={22}/>, label: "Pasar", path: "/marketplace" },
    { icon: <TrendingUp size={22}/>, label: "Logistik", path: "/dashboard/transaksi" },
  ]

  const extraItems = [
    { icon: <User size={20} className="text-blue-500"/>, label: "Profil", path: "/dashboard/profil" },
    { icon: <Bell size={20} className="text-yellow-500"/>, label: "Notifikasi", path: "#" },
    { icon: <Settings size={20} className="text-slate-500"/>, label: "Setelan", path: "#" },
    { icon: <HelpCircle size={20} className="text-orange-500"/>, label: "Bantuan", path: "#" },
  ]

  return (
    <>    
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-100 h-screen sticky pt-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 flex flex-col h-full relative">
             
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-emerald-800 shadow-sm z-[100] transition-transform active:scale-90"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
 
          <div className={`flex items-center mb-10 transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
            <div className="flex-shrink-0">
              <Image src="/light.png" alt="Logo" width={32} height={32} />
            </div>
            {!isCollapsed && <span className="font-bold text-emerald-900 tracking-tight text-xl animate-in fade-in duration-500 overflow-hidden whitespace-nowrap">Harsa</span>}
          </div>
             
          <nav className="flex-1 space-y-2 w-full flex flex-col items-center">
            {[...mainItems, { icon: <User size={22}/>, label: "Profil", path: "/dashboard/profil" }].map((item) => (
              <Link key={item.path} href={item.path}
                className={`flex items-center transition-all duration-300 rounded-2xl font-bold ${
                  pathname === item.path 
                    ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-400 hover:bg-slate-50'
                } ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'w-full px-4 py-3 gap-4'}`}
                title={isCollapsed ? item.label : ''} 
              >
                <div className="flex-shrink-0 flex items-center justify-center">{item.icon}</div>
                {!isCollapsed && <span className="text-sm animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </nav>
 
          <div className="pt-4 border-t border-slate-50 mt-auto flex flex-col items-center w-full">
            <button 
              onClick={logout} 
              className={`flex items-center transition-all duration-300 text-slate-400 hover:text-red-600 font-bold text-sm ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'w-full px-4 py-4 gap-4'}`}
              title={isCollapsed ? 'Keluar' : ''}
            >
              <div className="flex-shrink-0 flex items-center justify-center"><LogOut size={20} /></div>
              {!isCollapsed && <span className="animate-in fade-in duration-300">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>
 
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-3 z-[70] flex justify-around items-center shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {mainItems.map((item) => (
          <Link key={item.path} href={item.path}
            className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${
              pathname === item.path && !isMenuOpen ? 'text-emerald-900' : 'text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${pathname === item.path && !isMenuOpen ? 'bg-emerald-50' : ''}`}>
              {React.cloneElement(item.icon, { size: 20 })}
            </div>
            <span className="text-[9px] font-bold tracking-tighter">{item.label}</span>
          </Link>
        ))}
        
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${isMenuOpen ? 'text-emerald-900' : 'text-slate-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isMenuOpen ? 'bg-emerald-50' : ''}`}>
            <MenuIcon size={20} />
          </div>
          <span className="text-[9px] font-bold tracking-tighter">Menu</span>
        </button>
      </nav>
 
      {isMenuOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative bg-white rounded-t-[2.5rem] p-8 pb-14 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Menu Lainnya</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {extraItems.map((item) => (
                <Link 
                  key={item.label} href={item.path} onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-slate-50 border border-slate-100 active:scale-95 transition-all"
                >
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                </Link>
              ))}
              <button 
                onClick={logout}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-red-50 border border-red-100 active:scale-95 transition-all"
              >
                <div className="p-2.5 bg-white rounded-2xl shadow-sm text-red-500">
                  <LogOut size={20} />
                </div>
                <span className="text-[10px] font-bold text-red-600">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
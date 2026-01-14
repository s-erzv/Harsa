"use client"
import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Package, BarChart3, 
  User, LogOut, X, ShoppingBag,
  HelpCircle, ChevronLeft, ChevronRight,
  Truck, Mail, MessageSquare, TrendingUp,
  Plus, Store, Sparkles, Activity, LayoutGrid 
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'
import OnboardingModal from '@/components/OnboardingModal'
import ThemeToggle from '@/components/ThemeToggle'

export default function Sidebar({ logout }) {
  const { user, supabase } = useAuth()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) 
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [forceOnboarding, setForceOnboarding] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchUnreadChats()
      const channel = supabase
        .channel('realtime_unread_chats')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          fetchUnreadChats()
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [user, supabase])

  const fetchUnreadChats = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
    if (!error) setUnreadChatCount(data?.length || 0)
  }

  const mainItems = [
    { icon: <LayoutDashboard size={22}/>, label: "Home", path: "/dashboard" },
    { icon: <Package size={22}/>, label: "Products", path: "/dashboard/produk" },
    { icon: <ShoppingBag size={22}/>, label: "Market", path: "/marketplace" },
    { icon: <TrendingUp size={22}/>, label: "Orders", path: "/dashboard/transaksi" },
  ]

  return (
    <>     
      <OnboardingModal 
        forceOpen={forceOnboarding} 
        onClose={() => setForceOnboarding(false)} 
      />

      <aside className={`hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-500 ease-in-out z-[100] ${isCollapsed ? 'w-24' : 'w-64'}`}>
        
        <div className="p-6 flex-shrink-0 relative">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 bg-forest dark:bg-harvest text-white rounded-full p-1.5 hover:scale-110 shadow-xl z-[110] transition-all active:scale-90"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            <div className="flex-shrink-0 bg-muted p-2 rounded-2xl border border-border shadow-inner">
              <Image 
                src="/light.png" 
                alt="Logo" 
                width={24} 
                height={24} 
                className="dark:hidden"
              />
              <Image 
                src="/dark.png" 
                alt="Logo" 
                width={24} 
                height={24} 
                className="hidden dark:block"
              />
            </div>
            {!isCollapsed && <span className="font-bold text-foreground tracking-tighter text-2xl italic">Harsa.</span>}
          </div>
        </div>
              
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-4 flex flex-col items-center"> 
          {mainItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
                  isActive 
                    ? 'bg-forest dark:bg-harvest text-white shadow-lg' 
                    : 'text-stone/60 hover:bg-muted hover:text-foreground'
                } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!isCollapsed && <span className="text-sm font-semibold tracking-tight">{item.label}</span>}
              </Link>
            )
          })}

          <div className={`h-px bg-border my-4 transition-all flex-shrink-0 ${isCollapsed ? 'w-10' : 'w-full'}`} />

          <SidebarLink isCollapsed={isCollapsed} icon={<Store size={22}/>} label="My Sales" path="/dashboard/penjualan" active={pathname === "/dashboard/penjualan"} />
          <SidebarLink isCollapsed={isCollapsed} icon={<MessageSquare size={22}/>} label="Messages" path="/dashboard/chat" active={pathname === "/dashboard/chat"} unread={unreadChatCount} />
          <SidebarLink isCollapsed={isCollapsed} icon={<BarChart3 size={22}/>} label="Business Analytics" path="/dashboard/analisis" active={pathname === "/dashboard/analisis"} />
          <SidebarLink isCollapsed={isCollapsed} icon={<User size={22}/>} label="My Profile" path="/dashboard/profil" active={pathname === "/dashboard/profil"} />

          <button 
            onClick={() => setIsHelpOpen(true)}
            className={`flex items-center transition-all duration-300 rounded-2xl font-bold text-stone/60 hover:bg-muted hover:text-foreground shrink-0 ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
          >
            <HelpCircle size={22}/>
            {!isCollapsed && <span className="text-sm">Support</span>}
          </button>
        </nav> 

        <div className="p-4 border-t border-border flex flex-col gap-2 flex-shrink-0">
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : 'px-2'}`}>
             <ThemeToggle />
             <NotificationBell />
          </div>
          <button 
            onClick={logout} 
            className={`flex items-center transition-all duration-300 text-stone/40 hover:text-red-500 font-bold text-sm ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-4 gap-4'}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
   
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-[120] shadow-2xl pb-safe h-20">
          <div className="flex items-center justify-around px-2 h-full">
            <MobileNavLink item={mainItems[0]} isActive={pathname === mainItems[0].path && !isMenuOpen} />
            <MobileNavLink item={mainItems[1]} isActive={pathname === mainItems[1].path && !isMenuOpen} />

            <div className="relative -top-6 flex flex-col items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-background ${isMenuOpen ? 'bg-red-500 text-white rotate-45' : 'bg-forest dark:bg-harvest text-white shadow-forest/40'}`}
              >
                <LayoutGrid size={28} strokeWidth={2.5} />
                {unreadChatCount > 0 && !isMenuOpen && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-background animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
              <span className={`text-[9px] font-bold mt-1 tracking-widest transition-colors duration-300 ${isMenuOpen ? 'text-red-500' : 'text-forest dark:text-harvest'}`}>HUB</span>
            </div>

            <MobileNavLink item={mainItems[2]} isActive={pathname === mainItems[2].path && !isMenuOpen} />
            <MobileNavLink item={mainItems[3]} isActive={pathname === mainItems[3].path && !isMenuOpen} />
          </div>
      </nav>
   
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsMenuOpen(false)} />
          <div className="relative bg-card rounded-t-[3rem] p-8 pb-32 animate-in slide-in-from-bottom duration-500 shadow-2xl border-t border-border overflow-hidden">
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-8" />
            
            <div className="grid grid-cols-2 gap-4">
              <MobileMenuItem icon={<MessageSquare size={22}/>} label="Messages" path="/dashboard/chat" onClick={() => setIsMenuOpen(false)} unread={unreadChatCount} />
              <MobileMenuItem icon={<Store size={22}/>} label="My Sales" path="/dashboard/penjualan" onClick={() => setIsMenuOpen(false)} />
              <MobileMenuItem icon={<User size={22}/>} label="My Profile" path="/dashboard/profil" onClick={() => setIsMenuOpen(false)} />
              <MobileMenuItem icon={<BarChart3 size={22}/>} label="Analytics" path="/dashboard/analisis" onClick={() => setIsMenuOpen(false)} />
            </div>

            <div className="mt-6 space-y-3">
              <button 
                onClick={() => { setIsMenuOpen(false); setIsHelpOpen(true); }}
                className="flex items-center justify-center gap-3 w-full bg-muted h-16 rounded-[2rem] font-bold text-sm italic"
              >
                <HelpCircle size={20} className="text-harvest" /> Help & Support
              </button>
              
              <button onClick={logout} className="flex items-center justify-center gap-3 w-full bg-red-500/10 text-red-500 h-16 rounded-[2rem] font-bold text-sm uppercase tracking-widest">
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-background/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative bg-card w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center border border-border">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-border">
              <MessageSquare size={32} className="text-harvest" />
            </div>
            <h3 className="text-2xl font-bold tracking-tighter italic mb-3 text-foreground">Support Center</h3>
            <p className="text-stone/50 text-xs mb-8 leading-relaxed font-medium">Connect with our team or read the node operator manual.</p>
            
            <div className="space-y-4">
                <button 
                  onClick={() => { setIsHelpOpen(false); setForceOnboarding(true); }}
                  className="w-full bg-foreground text-background h-16 rounded-[2rem] font-bold transition hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest"
                >
                  <Sparkles size={18} className="inline mr-2 text-harvest" /> Operator Guide
                </button>

                <a href="mailto:support@harsa.network" className="flex items-center justify-center gap-3 w-full bg-muted border border-border text-foreground h-16 rounded-[2rem] font-bold transition hover:bg-card active:scale-95 text-xs uppercase tracking-widest">
                  <Mail size={18} /> Contact Oracle
                </a>
            </div>
            
            <button onClick={() => setIsHelpOpen(false)} className="mt-8 text-stone/40 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition">Close Console</button>
          </div>
        </div>
      )}
    </>
  )
}

function SidebarLink({ isCollapsed, icon, label, path, active, unread }) {
  return (
    <Link href={path}
      className={`relative flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
        active ? 'bg-forest dark:bg-harvest text-white shadow-lg' : 'text-stone/60 hover:bg-muted'
      } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
    >
      {icon}
      {!isCollapsed && <span className="text-sm font-semibold tracking-tight">{label}</span>}
      {unread > 0 && (
        <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-4'} bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-card`}>
          {unread}
        </span>
      )}
    </Link>
  )
}

function MobileNavLink({ item, isActive }) {
  return (
    <Link href={item.path} className="flex flex-col items-center justify-center min-w-[64px] transition-all">
      <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-forest/10 dark:bg-harvest/10 text-forest dark:text-harvest' : 'text-stone/30'}`}>
        {React.cloneElement(item.icon, { size: 22, strokeWidth: isActive ? 2.5 : 2 })}
      </div>
      <span className={`text-[8px] font-bold mt-1 tracking-widest transition-all duration-500 uppercase ${isActive ? 'text-forest dark:text-harvest opacity-100' : 'text-stone/30 opacity-50'}`}>
        {item.label}
      </span>
    </Link>
  )
}

function MobileMenuItem({ icon, label, path, onClick, unread }) {
  return (
    <Link href={path} onClick={onClick} className="relative flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] bg-muted border border-border active:scale-95 transition-all overflow-hidden">
      <div className="text-harvest">{icon}</div>
      <span className="text-[10px] font-bold text-foreground tracking-widest uppercase">{label}</span>
      {unread > 0 && (
        <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
          {unread}
        </span>
      )}
    </Link>
  )
}
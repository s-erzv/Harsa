"use client"
import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Package, BarChart3, 
  User, LogOut, X, ShoppingBag,
  HelpCircle, ChevronLeft, ChevronRight,
  Truck, Mail, MessageSquare, TrendingUp,
  Plus, Store, Sparkles, Activity    
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'
import OnboardingModal from '@/components/OnboardingModal'

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

      <aside className={`hidden md:flex flex-col bg-white shadow-xl border-r border-clay/30 h-screen sticky top-0 transition-all duration-300 ease-in-out z-[100] ${isCollapsed ? 'w-24' : 'w-64'}`}>
        
        <div className="p-6 flex-shrink-0 relative">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 bg-forest text-chalk border border-forest rounded-full p-1.5 hover:bg-forest/90 shadow-md z-[110] transition-all active:scale-90"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            <div className="flex-shrink-0 bg-chalk p-1.5 rounded-xl border border-clay">
              <Image src="/light.png" alt="Logo" width={24} height={24} />
            </div>
            {!isCollapsed && <span className="font-bold text-forest tracking-tighter text-2xl">Harsa</span>}
          </div>
        </div>
              
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-4 font-raleway flex flex-col items-center"> 
          {mainItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
                  isActive 
                    ? 'bg-forest text-chalk shadow-lg shadow-forest/20' 
                    : 'text-stone/60 hover:bg-chalk hover:text-forest'
                } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          })}

          <Link href="/dashboard/penjualan"
            className={`flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
              pathname === "/dashboard/penjualan" ? 'bg-forest text-chalk shadow-lg' : 'text-stone/60 hover:bg-chalk'
            } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
          >
            <Store size={22}/>
            {!isCollapsed && <span className="text-sm">My Sales</span>}
          </Link>

          <Link href="/dashboard/chat"
            className={`relative flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
              pathname === "/dashboard/chat" ? 'bg-forest text-chalk shadow-lg' : 'text-stone/60 hover:bg-chalk'
            } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
          >
            <MessageSquare size={22}/>
            {!isCollapsed && <span className="text-sm">Messages</span>}
            {unreadChatCount > 0 && (
              <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-4'} bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce`}>
                {unreadChatCount}
              </span>
            )}
          </Link>

          <div className={`h-px bg-clay/30 my-4 transition-all flex-shrink-0 ${isCollapsed ? 'w-10' : 'w-full'}`} />

          <Link href="/dashboard/analisis"
            className={`flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
              pathname === "/dashboard/analisis" ? 'bg-forest text-chalk shadow-lg' : 'text-stone/60 hover:bg-chalk'
            } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
          >
            <BarChart3 size={22}/>
            {!isCollapsed && <span className="text-sm">Business Analytics</span>}
          </Link>
          
          <Link href="/dashboard/profil"
            className={`flex items-center transition-all duration-300 rounded-2xl font-bold shrink-0 ${
              pathname === "/dashboard/profil" ? 'bg-forest text-chalk shadow-lg' : 'text-stone/60 hover:bg-chalk'
            } ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
          >
            <User size={22}/>
            {!isCollapsed && <span className="text-sm">My Profile</span>}
          </Link>

          <button 
            onClick={() => setIsHelpOpen(true)}
            className={`flex items-center transition-all duration-300 rounded-2xl font-bold text-stone/60 hover:bg-chalk hover:text-forest shrink-0 ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-3.5 gap-4'}`}
          >
            <HelpCircle size={22}/>
            {!isCollapsed && <span className="text-sm">Support</span>}
          </button>

          <div className={`flex items-center transition-all duration-300 rounded-2xl font-bold text-stone/60 shrink-0 ${isCollapsed ? 'justify-center w-14 h-14' : 'w-full px-2 py-2 gap-4'}`}>
              <NotificationBell />
              {!isCollapsed && <span className="text-sm">Notifications</span>}
          </div>
        </nav> 

        <div className="p-4 border-t border-clay flex-shrink-0">
          <button 
            onClick={logout} 
            className={`flex items-center transition-all duration-300 text-stone/40 hover:text-red-600 font-bold text-sm ${isCollapsed ? 'justify-center w-14 h-14 p-0' : 'w-full px-4 py-4 gap-4'}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
   
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-clay/10 z-[120] shadow-[0_-10px_25px_rgba(0,0,0,0.05)] pb-safe h-20">
          <div className="flex items-center justify-around px-2 h-full">
            <MobileNavLink item={mainItems[0]} isActive={pathname === mainItems[0].path && !isMenuOpen} />
            <MobileNavLink item={mainItems[1]} isActive={pathname === mainItems[1].path && !isMenuOpen} />

            <div className="relative -top-6 flex flex-col items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-white ${isMenuOpen ? 'bg-harvest text-forest rotate-45' : 'bg-forest text-chalk shadow-forest/40'}`}
              >
                <Plus size={32} strokeWidth={2.5} />
                {unreadChatCount > 0 && !isMenuOpen && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
              <span className={`text-[10px] font-bold mt-1 tracking-tight transition-colors duration-300 ${isMenuOpen ? 'text-harvest' : 'text-forest'}`}>Menu</span>
            </div>

            <MobileNavLink item={mainItems[2]} isActive={pathname === mainItems[2].path && !isMenuOpen} />
            <MobileNavLink item={mainItems[3]} isActive={pathname === mainItems[3].path && !isMenuOpen} />
          </div>
      </nav>
   
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-forest/30 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMenuOpen(false)} />
          <div className="relative bg-white rounded-t-[3rem] p-6 pb-24 animate-in slide-in-from-bottom duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden font-raleway border-t border-clay/10">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <ShoppingBag size={200} className="rotate-12 text-forest" />
            </div>
            <div className="w-12 h-1 bg-clay/20 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-xl font-bold text-forest italic tracking-tight uppercase">Harsa Services</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-chalk rounded-full text-forest border border-clay active:scale-90 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[60vh] px-1 no-scrollbar">
              <Link 
                href="/dashboard/chat" 
                onClick={() => setIsMenuOpen(false)}
                className="relative flex items-center gap-3 p-4 rounded-2xl bg-white border border-clay/30 active:scale-95 transition-all shadow-sm overflow-hidden"
              >
                <div className="p-2 bg-chalk rounded-xl text-forest shrink-0 flex items-center justify-center">
                  <MessageSquare size={22}/>
                </div>
                <span className="text-[11px] font-bold text-stone leading-tight tracking-tight uppercase">Chat</span>
                {unreadChatCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                    {unreadChatCount} New
                  </span>
                )}
              </Link>
              <MobileMenuItem icon={<Store size={22}/>} label="My Sales" path="/dashboard/penjualan" onClick={() => setIsMenuOpen(false)} />
              <MobileMenuItem icon={<User size={22}/>} label="My Profile" path="/dashboard/profil" onClick={() => setIsMenuOpen(false)} />
              <MobileMenuItem icon={<BarChart3 size={22}/>} label="Business Analytics" path="/dashboard/analisis" onClick={() => setIsMenuOpen(false)} />
              
              <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-chalk border border-clay/20 active:scale-[0.98] transition-all min-h-[72px]">
                <div className="flex items-center justify-center">
                  <NotificationBell />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-stone truncate leading-tight uppercase">Notifications</span>
                  <span className="text-[10px] text-stone/50 truncate uppercase">Latest news & updates</span>
                </div>
              </div>

              <button 
                onClick={() => { setIsMenuOpen(false); setIsHelpOpen(true); }}
                className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-chalk border border-clay/20 active:scale-[0.98] transition-all text-left min-h-[72px]"
              >
                <div className="p-2.5 bg-white rounded-2xl text-forest shadow-sm flex items-center justify-center">
                  <HelpCircle size={22} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-forest truncate leading-tight uppercase">Help Center</span>
                  <span className="text-[10px] text-stone/50 truncate uppercase">Contact & team support</span>
                </div>
              </button>
              
              <button onClick={logout} className="mt-2 flex items-center justify-center gap-3 p-5 rounded-[1.5rem] bg-red-50 border border-red-100 active:scale-95 transition-all w-full text-red-600 font-bold text-sm uppercase">
                <LogOut size={20} className="text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-forest/60 backdrop-blur-md" onClick={() => setIsHelpOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 font-raleway text-center">
            <div className="w-16 h-16 bg-chalk rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg text-forest">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-xl font-bold text-forest mb-2 tracking-tight uppercase">Help Center</h3>
            <p className="text-stone text-xs mb-6 leading-relaxed font-medium px-2">Need a refresher on how Harsa works or having trouble with a node?</p>
            
            <div className="space-y-3">
                <button 
                  onClick={() => { setIsHelpOpen(false); setForceOnboarding(true); }}
                  className="flex items-center justify-center gap-3 w-full bg-chalk text-forest h-14 rounded-2xl font-bold border border-clay/30 hover:bg-white transition active:scale-95 text-xs uppercase tracking-wider"
                >
                  <Sparkles size={18} className="text-harvest" /> Guide Me
                </button>

                <a href="mailto:sarahfajriarahmah@gmail.com" className="flex items-center justify-center gap-3 w-full bg-forest text-white h-14 rounded-2xl font-bold shadow-xl shadow-forest/20 hover:bg-forest/90 transition active:scale-95 text-xs uppercase tracking-wider">
                  <Mail size={18} /> Contact Support
                </a>
            </div>
            
            <button onClick={() => setIsHelpOpen(false)} className="mt-6 text-stone/40 text-[10px] font-bold uppercase tracking-widest hover:text-forest transition">Close</button>
          </div>
        </div>
      )}
    </>
  )
}

function MobileNavLink({ item, isActive }) {
  return (
    <Link href={item.path} className="flex flex-col items-center justify-center min-w-[64px] transition-all">
      <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-forest/5 text-forest' : 'text-stone/30'}`}>
        {React.cloneElement(item.icon, { size: 22, strokeWidth: isActive ? 2.5 : 2 })}
      </div>
      <span className={`text-[9px] font-bold mt-0.5 tracking-tight transition-all duration-300 uppercase ${isActive ? 'text-forest' : 'text-stone/30'}`}>
        {item.label}
      </span>
    </Link>
  )
}

function MobileMenuItem({ icon, label, path, onClick }) {
  return (
    <Link href={path} onClick={onClick} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-clay/30 active:scale-95 transition-all shadow-sm overflow-hidden">
      <div className="p-2 bg-chalk rounded-xl text-forest shrink-0 flex items-center justify-center">{icon}</div>
      <span className="text-[11px] font-bold text-stone leading-tight tracking-tight uppercase">{label}</span>
    </Link>
  )
}
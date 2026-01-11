"use client"
import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Package, X, MessageSquare, Info, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function NotificationBell() {
  const { user, supabase } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false) 
  const [showDrawer, setShowDrawer] = useState(false)      
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchNotifications()
       
      const channel = supabase
        .channel('realtime_notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        }, payload => {
          setNotifications(prev => {
            const isDuplicate = prev.some(n => n.id === payload.new.id);
            if (isDuplicate) return prev;
            return [payload.new, ...prev].slice(0, 8); 
          })
          setUnreadCount(prev => prev + 1)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [user])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)
    
    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.is_read).length || 0)
  }

  const handleOpenNotifications = () => {
    if (window.innerWidth < 768) {
      setShowDrawer(true)
    } else {
      setShowDropdown(!showDropdown)
    }
    if (unreadCount > 0) markAsRead()
  }

  const markAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
    setUnreadCount(0)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 size={16} className="text-emerald-600" />
      case 'MESSAGE': return <MessageSquare size={16} className="text-blue-600" />
      case 'INFO': return <Zap size={16} className="text-harvest" />
      default: return <Package size={16} className="text-slate-500" />
    }
  }

  const NotificationList = (
    <div className="flex flex-col h-full bg-white font-raleway overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <Bell size={32} strokeWidth={1.5} />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">No new updates</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-default group">
              <div className="flex gap-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                  n.type === 'SUCCESS' ? 'bg-emerald-50' : n.type === 'MESSAGE' ? 'bg-blue-50' : 'bg-slate-50'
                }`}>
                  {getIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[11px] font-bold text-forest uppercase tracking-tight truncate mr-2">{n.title}</p>
                    <span className="text-[8px] font-bold text-slate-300 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone/70 leading-relaxed line-clamp-2">{n.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button 
        onClick={handleOpenNotifications}
        className="relative p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-clay/20 shadow-sm hover:bg-white transition active:scale-90 group z-40"
      >
        <Bell size={20} className="text-forest group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="hidden md:block fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="hidden md:block fixed top-24 right-10 w-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/40">Recent Notifications</h3>
              </div>
              <button onClick={() => setShowDropdown(false)} className="p-1 hover:bg-white rounded-full transition-colors text-slate-300 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-[450px] overflow-hidden flex flex-col">
              {NotificationList}
            </div>
          </div>
        </>
      )}

      <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
        <SheetContent side="bottom" className="md:hidden h-[75vh] p-0 rounded-t-[3rem] overflow-hidden border-none z-[200]">
          <SheetHeader className="p-8 border-b border-slate-50 shrink-0 bg-white">
            <SheetTitle className="flex items-center gap-4 text-forest text-left">
              <div className="p-3 bg-slate-50 rounded-2xl"><Bell size={20} className="text-forest" /></div>
              <div className="flex flex-col">
                <span className="font-bold text-xl italic tracking-tight leading-none mb-1">Updates</span>
                <span className="text-[9px] text-stone/40 uppercase tracking-widest font-bold">Activity Feed</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="h-full bg-white">
            {NotificationList}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
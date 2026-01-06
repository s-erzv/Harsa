"use client"
import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Package, X, MessageSquare, Info } from 'lucide-react'
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
    markAsRead()
  }

  const markAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
    setUnreadCount(0)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'Success': return <CheckCircle2 size={18} className="text-emerald-600" />
      case 'Message': return <MessageSquare size={18} className="text-blue-600" />
      case 'Info': return <Info size={18} className="text-harvest" />
      default: return <Package size={18} className="text-slate-600" />
    }
  }

  const getBg = (type) => {
    switch (type) {
      case 'Success': return 'bg-emerald-50'
      case 'Message': return 'bg-blue-50'
      case 'Info': return 'bg-orange-50'
      default: return 'bg-slate-50'
    }
  }

  const NotificationList = (
    <div className="flex flex-col h-full bg-white font-raleway">
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell size={40} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-300 text-[10px] font-bold">No updates yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-5 border-b border-slate-50 hover:bg-slate-50/50 transition cursor-default group">
              <div className="flex gap-4">
                <div className={`p-2.5 rounded-2xl h-fit shrink-0 transition-transform group-hover:scale-110 ${getBg(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-forest mb-1">{n.title}</p>
                  <p className="text-[10px] text-stone font-medium leading-relaxed">{n.message}</p>
                  <p className="text-[8px] text-slate-300 mt-2 font-bold">{new Date(n.created_at).toLocaleTimeString()}</p>
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
        className="relative p-3 bg-white rounded-2xl border border-clay/30 shadow-sm hover:bg-slate-50 transition active:scale-90 group"
      >
        <Bell size={20} className="text-forest group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </button>

      {showDropdown && (
        <div className="hidden md:block absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-chalk/30">
            <h3 className="text-[10px] text-forest/40">Recent Activity</h3>
            <button onClick={() => setShowDropdown(false)}><X size={16} className="text-slate-300 hover:text-red-500 transition-colors" /></button>
          </div>
          <div className="max-h-[450px] overflow-y-auto">
            {NotificationList}
          </div>
        </div>
      )}

      <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
        <SheetContent side="bottom" className="md:hidden h-[70vh] p-0 rounded-t-[3rem] overflow-hidden border-none z-[200]">
          <SheetHeader className="p-8 border-b border-slate-50 shrink-0 bg-white">
            <SheetTitle className="flex items-center gap-3 text-forest text-left">
              <div className="p-2 bg-chalk rounded-xl"><Bell size={18} /></div>
              <div className="flex flex-col">
                <span className="font-bold text-lg italic leading-none mb-1">Notifications</span>
                <span className="text-[9px] text-stone/40lack">Your Activity Feed</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-hidden">
            {NotificationList}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
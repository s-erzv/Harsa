"use client"
import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Package, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function NotificationBell() {
  const { user, supabase } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
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
          setNotifications(prev => [payload.new, ...prev])
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
      .limit(5)
    
    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.is_read).length || 0)
  }

  const markAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => { setShowDropdown(!showDropdown); markAsRead(); }}
        className="relative p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition active:scale-90"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] border border-slate-100 shadow-2xl z-[60] overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-raleway">Notifikasi</h3>
            <button onClick={() => setShowDropdown(false)}><X size={14} className="text-slate-300" /></button>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-300 text-[10px] font-bold uppercase italic">Belum ada kabar</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-5 border-b border-slate-50 hover:bg-slate-50 transition cursor-default">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-xl h-fit ${n.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {n.type === 'SUCCESS' ? <CheckCircle2 size={16} /> : <Package size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight italic mb-1">{n.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
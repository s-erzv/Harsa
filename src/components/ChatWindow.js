"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Send, Loader2, MessageSquare, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function ChatWindow({ 
  receiverId, 
  receiverName, 
  transactionId = null, 
  isMobileDrawer = false, 
  isOpen = false, 
  onClose = () => {} 
}) {
  const { user, supabase } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef()

  useEffect(() => {
    if (user && receiverId) {
      fetchMessages()
      const channel = supabase
        .channel(`chat_${receiverId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}` 
        }, payload => {
          if (payload.new.sender_id === receiverId) {
            setMessages(prev => {
              const isDuplicate = prev.some(m => m.id === payload.new.id);
              if (isDuplicate) return prev;
              return [...prev, payload.new];
            })
          }
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [user, receiverId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const messageData = { sender_id: user.id, receiver_id: receiverId, content: newMessage, transaction_id: transactionId }
    const { data, error } = await supabase.from('messages').insert(messageData).select().single()
    if (!error && data) {
      setMessages(prev => [...prev, data])
      setNewMessage('')
      await supabase.from('notifications').insert({
        user_id: receiverId,
        title: `Pesan baru dari ${user.user_metadata?.full_name || 'Seseorang'}`,
        message: newMessage.substring(0, 50),
        type: 'MESSAGE'
      })
    }
  }

  const ChatContent = (
    <div className="flex flex-col h-full w-full bg-white font-raleway overflow-hidden">
      {!isMobileDrawer && (
        <div className="p-6 bg-forest text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">{receiverName?.charAt(0)}</div>
            <div>
              <p className="font-bold text-sm tracking-tight leading-none mb-1">{receiverName}</p>
              <p className="text-[9px] opacity-60 tracking-widest leading-none">Chat terenkripsi</p>
            </div>
          </div>
          <MessageSquare size={18} className="opacity-40" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-forest" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-slate-300 text-[10px] font-bold italic">Mulai obrolan baru</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm text-sm font-medium leading-relaxed ${
                msg.sender_id === user.id ? 'bg-forest text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
                <p className={`text-[8px] mt-1 opacity-50 ${msg.sender_id === user.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-50 flex gap-2 shrink-0 pb-safe mb-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Tulis pesan..." className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs outline-none" />
        <button type="submit" className="p-3 bg-forest text-white rounded-2xl active:scale-95 shadow-lg"><Send size={18} /></button>
      </form>
    </div>
  )

  if (isMobileDrawer) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-[3rem] overflow-hidden border-none z-[200]">
          <SheetHeader className="p-6 border-b border-slate-50 shrink-0 bg-white">
            <SheetTitle className="flex items-center gap-3 text-forest text-left">
              <div className="w-10 h-10 bg-forest text-white rounded-full flex items-center justify-center font-bold text-sm">{receiverName?.charAt(0)}</div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none mb-1">{receiverName}</span>
                <span className="text-[9px] text-stone/40 uppercase tracking-widest font-black">Petani Terverifikasi</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          {ChatContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="flex flex-col h-[550px] w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
      {ChatContent}
    </div>
  )
}
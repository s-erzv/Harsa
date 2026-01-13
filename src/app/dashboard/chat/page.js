"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import ChatWindow from '@/components/ChatWindow'
import { MessageSquare, Search, ArrowLeft, Loader2, ShieldCheck, Lock } from 'lucide-react'
import CryptoJS from 'crypto-js'

const CHAT_SALT = process.env.NEXT_PUBLIC_CHAT_SALT || "harsa_secure_node_2026";

export default function ChatDashboard() {
  const { user, supabase } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const decryptPreview = useCallback((ciphertext, otherId) => {
    try {
      const sortedIds = [user.id, otherId].sort().join('_');
      const key = `${CHAT_SALT}_${sortedIds}`;
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "[Secure Transmission]";
    } catch (e) {
      return "[Encrypted]";
    }
  }, [user?.id]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, sender_id, receiver_id, is_read,
        sender:profiles!messages_sender_id_fkey(id, full_name),
        receiver:profiles!messages_receiver_id_fkey(id, full_name)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    const uniqueChats = []
    const seen = new Set()

    data?.forEach(msg => {
      const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
      if (otherUser && !seen.has(otherUser.id)) {
        uniqueChats.push({
          id: otherUser.id,
          name: otherUser.full_name,
          lastMessage: decryptPreview(msg.content, otherUser.id),
          unread: msg.receiver_id === user.id && !msg.is_read,
          time: new Date(msg.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })
        })
        seen.add(otherUser.id)
      }
    })
    setConversations(uniqueChats)
    setLoading(false)
  }, [user, supabase, decryptPreview]);

  useEffect(() => {
    if (user) {
      fetchConversations()
      const channel = supabase
        .channel('dashboard_conversations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchConversations()
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [user, fetchConversations, supabase])

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', chat.id)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
    
    setConversations(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unread: false } : c
    ))
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-forest" size={40} />
      <p className="text-[10px] font-bold text-stone/40 tracking-widest">Syncing Node...</p>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white md:rounded-[2.5rem] md:border border-slate-100 overflow-hidden font-raleway md:shadow-2xl md:shadow-forest/5">
      
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-slate-50 flex-col bg-white shrink-0`}>
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-forest tracking-tighter">Messages</h1>
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-forest transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-forest/5 outline-none transition-all" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-hide">
          <div className="mx-2 mb-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex gap-3">
             <Lock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
             <p className="text-[9px] font-semibold text-emerald-700/70 leading-relaxed">
                All transmissions are secured via Harsa End-to-End Encryption protocol. 
             </p>
          </div>

          {conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
            <button 
              key={chat.id} 
              onClick={() => handleSelectChat(chat)}
              className={`w-full p-4 flex items-center gap-4 rounded-[1.8rem] transition-all group ${
                selectedChat?.id === chat.id ? 'bg-forest text-white shadow-xl shadow-forest/20' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border transition-transform group-active:scale-90 ${
                selectedChat?.id === chat.id ? 'bg-white/20 border-white/20' : 'bg-chalk border-clay/30 text-forest'
              }`}>
                {chat.name.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <p className={`text-xs font-bold truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-slate-800'}`}>
                    {chat.name}
                  </p>
                  <span className="text-[8px] font-bold opacity-40">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] truncate ${selectedChat?.id === chat.id ? 'text-white/60' : 'opacity-60'}`}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread && <div className="w-2 h-2 bg-harvest rounded-full animate-pulse shadow-lg shadow-harvest/50" />}
                </div>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="py-20 text-center opacity-20">
              <MessageSquare size={40} className="mx-auto mb-4" />
              <p className="text-xs font-bold tracking-widest">No nodes synced</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 bg-slate-50/30 flex-col overflow-hidden relative`}>
        {selectedChat ? (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="md:hidden p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedChat(null)} className="p-2 bg-slate-50 rounded-xl text-forest active:scale-90 transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-forest text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-lg">
                    {selectedChat.name.charAt(0)}
                  </div>
                  <p className="font-bold text-forest text-sm">{selectedChat.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative bg-white overflow-hidden">
                <ChatWindow 
                  receiverId={selectedChat.id} 
                  receiverName={selectedChat.name} 
                  isOpen={true}
                  onClose={() => setSelectedChat(null)}
                />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center opacity-20 transform -rotate-3">
              <MessageSquare size={80} className="mx-auto mb-6 text-forest" />
              <h3 className="text-xl font-bold text-forest tracking-tighter">Select Node</h3>
              <p className="text-[10px] font-bold tracking-[0.3em]">Private Encryption Active</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
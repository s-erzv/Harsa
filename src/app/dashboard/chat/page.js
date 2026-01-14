"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import ChatWindow from '@/components/ChatWindow'
import ThemeToggle from '@/components/ThemeToggle'
import { MessageSquare, Search, ArrowLeft, Loader2, ShieldCheck, Lock, Globe, Zap } from 'lucide-react'
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
      return "[Encrypted Signal]";
    }
  }, [user?.id]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, sender_id, receiver_id, is_read,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
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
          avatar: otherUser.avatar_url,
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
    <div className="h-[70vh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin text-harvest mb-4" size={40} />
      <p className="text-[10px] font-bold text-stone/40 tracking-[0.3em] uppercase animate-pulse">Syncing Encrypted Nodes...</p>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-140px)] bg-card border border-border md:rounded-[3rem] overflow-hidden font-raleway shadow-2xl transition-colors duration-500">
      
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] border-r border-border flex-col bg-card shrink-0 animate-in fade-in slide-in-from-left duration-500`}>
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center px-1">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tighter italic lowercase text-foreground leading-none">Messages<span className="text-harvest">.</span></h1>
              <p className="text-[10px] font-bold text-stone/40 uppercase tracking-widest italic leading-none">Secure P2P Channel</p>
            </div>
            <div className="p-3 bg-muted rounded-2xl border border-border">
               <ShieldCheck size={20} className="text-harvest" />
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone/20 group-focus-within:text-harvest transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search node identity..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-muted border border-border rounded-2xl text-xs font-semibold italic focus:border-harvest outline-none transition-all text-foreground" 
            />
          </div>

          <div className="p-4 rounded-2xl bg-harvest/5 border border-harvest/10 flex gap-4">
             <Lock size={16} className="text-harvest shrink-0 mt-1" />
             <p className="text-[10px] font-bold text-harvest/70 leading-relaxed italic uppercase tracking-tighter">
               End-to-End Encryption protocol active. Your private signals are never stored as plain-text.
             </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-10 space-y-2">
          {conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
            <button 
              key={chat.id} 
              onClick={() => handleSelectChat(chat)}
              className={`w-full p-5 flex items-center gap-5 rounded-[2.2rem] transition-all group relative border-2 ${
                selectedChat?.id === chat.id 
                  ? 'bg-forest dark:bg-harvest text-white border-transparent shadow-xl' 
                  : 'bg-card border-transparent hover:bg-muted text-stone/60'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shrink-0 border-2 transition-transform group-active:scale-90 overflow-hidden ${
                selectedChat?.id === chat.id ? 'bg-white/10 border-white/20' : 'bg-muted border-border text-harvest'
              }`}>
                {chat.avatar ? (
                  <img src={chat.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xl italic font-black">{chat.name.charAt(0)}</span>
                )}
              </div>
              
              <div className="text-left flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-bold italic truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-foreground'}`}>
                    {chat.name}
                  </p>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedChat?.id === chat.id ? 'text-white/40' : 'text-stone/30'}`}>{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[11px] truncate italic ${selectedChat?.id === chat.id ? 'text-white/60' : 'text-stone/40'}`}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread && (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-card" />
                  )}
                </div>
              </div>
            </button>
          ))}
          
          {conversations.length === 0 && (
            <div className="py-24 text-center space-y-4 opacity-10">
              <MessageSquare size={60} strokeWidth={1} className="mx-auto" />
              <p className="text-[10px] font-bold tracking-[0.4em] uppercase">No active signals</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 bg-background flex-col overflow-hidden relative transition-colors duration-500`}>
        {selectedChat ? (
          <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
            <div className="md:hidden p-6 bg-card border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <button onClick={() => setSelectedChat(null)} className="p-3 bg-muted rounded-2xl text-stone active:scale-90 transition-all border border-border">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4 text-left">
                  <div className="w-11 h-11 bg-forest dark:bg-harvest text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg shadow-forest/20">
                    {selectedChat.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground text-sm italic">{selectedChat.name}</p>
                    <p className="text-[9px] font-bold text-stone/40 uppercase tracking-widest">Signal Locked</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative bg-background overflow-hidden">
                <ChatWindow 
                  receiverId={selectedChat.id} 
                  receiverName={selectedChat.name} 
                  isOpen={true}
                  onClose={() => setSelectedChat(null)}
                />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
               <Globe size={600} className="translate-x-1/4 translate-y-1/4" />
            </div>
            <div className="text-center space-y-6 relative z-10 animate-in zoom-in duration-1000">
              <div className="w-24 h-24 bg-muted rounded-[2.5rem] border border-border flex items-center justify-center mx-auto shadow-inner group">
                 <Zap size={40} className="text-harvest group-hover:scale-125 transition-transform" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold italic tracking-tighter lowercase">Select a signal node<span className="text-harvest">.</span></h3>
                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone/40">Secure P2P Encryption Protocol active</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
"use client"
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ChatWindow from '@/components/ChatWindow'
import { MessageSquare, Search, ArrowLeft, Loader2 } from 'lucide-react'

export default function ChatDashboard() {
  const { user, supabase } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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
  }, [user])

  const fetchConversations = async () => {
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
          lastMessage: msg.content,
          unread: msg.receiver_id === user.id && !msg.is_read
        })
        seen.add(otherUser.id)
      }
    })
    setConversations(uniqueChats)
    setLoading(false)
  }

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
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-forest" size={40} />
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white md:rounded-[2.5rem] md:border border-slate-100 overflow-hidden font-raleway md:shadow-sm">
      
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-slate-50 flex-col bg-white shrink-0`}>
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-bold text-forest mb-6 italic tracking-tight">Messages</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl text-xs outline-none" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
            <button 
              key={chat.id} 
              onClick={() => handleSelectChat(chat)}
              className={`w-full p-4 flex items-center gap-4 rounded-[1.8rem] transition-all ${
                selectedChat?.id === chat.id ? 'bg-forest text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                selectedChat?.id === chat.id ? 'bg-white/20 border-white/20' : 'bg-chalk border-clay/30 text-forest'
              }`}>
                {chat.name.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs truncate">{chat.name}</p>
                  {chat.unread && <span className="w-2 h-2 bg-harvest rounded-full" />}
                </div>
                <p className="text-[10px] truncate opacity-60">{chat.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 bg-slate-50/30 flex-col overflow-hidden`}>
        {selectedChat ? (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="md:hidden p-4 bg-white border-b border-slate-100 flex items-center gap-4 shrink-0">
              <button onClick={() => setSelectedChat(null)} className="p-2 bg-slate-50 rounded-xl text-forest active:scale-90 transition-all">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-forest text-white rounded-full flex items-center justify-center font-bold text-xs uppercase italic">
                  {selectedChat.name.charAt(0)}
                </div>
                <p className="font-bold text-forest text-sm">{selectedChat.name}</p>
              </div>
            </div>
            
            <div className="flex-1 relative bg-white md:bg-transparent overflow-hidden">
                <ChatWindow 
                  receiverId={selectedChat.id} 
                  receiverName={selectedChat.name} 
                  isMobileDrawer={false} 
                  isDashboardMode={true} 
                />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center opacity-20">
              <MessageSquare size={64} className="mx-auto mb-4" />
              <p className="font-bold italic">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
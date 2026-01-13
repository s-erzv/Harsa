"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Send, Loader2, MessageSquare, Shield, Lock, X, LogIn } from 'lucide-react'
import CryptoJS from 'crypto-js'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const CHAT_SALT = process.env.NEXT_PUBLIC_CHAT_SALT || "harsa_secure_node_2026";

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
  const isFetching = useRef(false)

  const getSecurityKey = useCallback(() => {
    if (!user?.id || !receiverId) return CHAT_SALT;
    const sortedIds = [user.id, receiverId].sort().join('_');
    return `${CHAT_SALT}_${sortedIds}`;
  }, [user?.id, receiverId]);

  const decryptMessage = useCallback((ciphertext) => {
    try {
      const key = getSecurityKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "[Decryption Failed]";
    } catch (e) {
      return "[Encrypted Data]";
    }
  }, [getSecurityKey]);

  const encryptMessage = (text) => {
    return CryptoJS.AES.encrypt(text, getSecurityKey()).toString();
  }

  useEffect(() => {
    if (!user?.id || !receiverId || isFetching.current) return;

    const fetchMessages = async () => {
      isFetching.current = true;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
        
        if (error) throw error;

        const decryptedData = (data || []).map(msg => ({
          ...msg,
          content: decryptMessage(msg.content)
        }));
        setMessages(decryptedData);
      } catch (err) {
        console.error("Chat Sync Error:", err.message);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    fetchMessages();

    const channelId = `chat_${[user.id, receiverId].sort().join('_')}`.substring(0, 50);
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}` 
      }, payload => {
        if (payload.new.sender_id === receiverId) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, content: decryptMessage(payload.new.content) }];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [user?.id, receiverId, decryptMessage, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const rawText = newMessage;
    const encryptedContent = encryptMessage(rawText);
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanTxId = uuidRegex.test(transactionId) ? transactionId : null;

    const messageData = { 
      sender_id: user.id, 
      receiver_id: receiverId, 
      content: encryptedContent, 
      transaction_id: cleanTxId 
    };

    setNewMessage(''); 

    const { data, error } = await supabase.from('messages').insert(messageData).select().single();
    
    if (!error && data) {
      setMessages(prev => [...prev, { ...data, content: rawText }]);
      await supabase.from('notifications').insert({
        user_id: receiverId,
        title: `New Message`,
        message: "You have an encrypted transmission.",
        type: 'MESSAGE'
      });
    }
  };

  const ChatContent = (
    <div className="flex flex-col h-full w-full bg-white font-raleway overflow-hidden relative text-left">
      {!user && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 bg-chalk rounded-2xl flex items-center justify-center mb-4 border border-clay/30 shadow-sm">
            <Lock className="text-forest" size={24} />
          </div>
          <p className="text-forest font-bold mb-1">Secure Messaging</p>
          <p className="text-stone/50 text-[11px] mb-6 leading-relaxed">Sign in to initialize end-to-end encrypted communication.</p>
          <Link href="/login" className="w-full max-w-[160px]">
            <Button className="w-full bg-forest text-white rounded-xl h-11 font-bold text-[10px] tracking-widest shadow-xl shadow-forest/20">
              SIGN IN
            </Button>
          </Link>
        </div>
      )}

      {!isMobileDrawer && (
        <div className="p-4 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 bg-forest rounded-xl flex items-center justify-center font-bold text-white shadow-lg ">
              {receiverName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-xs text-slate-800 leading-none mb-1">{receiverName}</p>
              <div className="flex items-center gap-1">
                 <Shield size={10} className="text-emerald-500" />
                 <p className="text-[8px] text-emerald-500 font-bold ">E2EE Secured</p>
              </div>
            </div>
          </div>
          <Lock size={14} className="text-slate-200" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAFA]">
        {loading && user ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-forest" size={20} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 opacity-20">
             <MessageSquare size={32} className="mx-auto mb-2" />
             <p className="text-[10px] font-bold tracking-widest">Start Node Chat</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-[1.2rem] shadow-sm text-xs font-semibold leading-relaxed ${
                msg.sender_id === user?.id ? 'bg-forest text-white rounded-tr-none' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
                <p className={`text-[7px] mt-1.5 font-medium opacity-40 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-50 flex gap-2 shrink-0 pb-safe">
        <input 
          disabled={!user}
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Secure transmission..." 
          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-forest/5 outline-none disabled:opacity-30" 
        />
        <button disabled={!user} type="submit" className="p-3 bg-forest text-white rounded-xl active:scale-95 shadow-lg shadow-forest/10 disabled:opacity-30">
          <Send size={16} />
        </button>
      </form>
    </div>
  )

  if (isMobileDrawer) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-[2.5rem] overflow-hidden border-none z-[200] bg-white">
          <SheetHeader className="p-5 border-b border-slate-50 shrink-0 bg-white">
            <SheetTitle className="flex items-center gap-3 text-forest text-left">
              <div className="w-10 h-10 bg-forest text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg ">{receiverName?.charAt(0)}</div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-none mb-1 ">{receiverName}</span>
                <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-1">
                   <Shield size={10} /> Encrypted Transmission
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 h-full bg-white">{ChatContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-white shadow-2xl overflow-hidden border border-slate-100">
      {ChatContent}
    </div>
  )
}
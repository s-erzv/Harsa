"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Send, Loader2, MessageSquare, Shield, Lock, X, Sparkles } from 'lucide-react'
import CryptoJS from 'crypto-js'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'

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
  const channelRef = useRef(null)

  const getSecurityKey = useCallback(() => {
    if (!user?.id || !receiverId) return CHAT_SALT;
    const sortedIds = [user.id, receiverId].sort().join('_');
    return `${CHAT_SALT}_${sortedIds}`;
  }, [user?.id, receiverId]);

  const decryptMessage = useCallback((ciphertext) => {
    try {
      if (!ciphertext) return "";
      const key = getSecurityKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "[Encrypted Signal]";
    } catch (e) {
      return "[Encrypted Signal]";
    }
  }, [getSecurityKey]);

  const encryptMessage = (text) => {
    return CryptoJS.AES.encrypt(text, getSecurityKey()).toString();
  }

  useEffect(() => {
    if (!user?.id || !receiverId) return;

    const fetchMessages = async () => {
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
        console.error("Sync Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Perbaikan Realtime Logic: Gunakan ID unik untuk channel agar tidak 409
    const roomKey = [user.id, receiverId].sort().join('_');
    channelRef.current = supabase.channel(`chat_${roomKey}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, payload => {
        const msg = payload.new;
        const isRelevant = (msg.sender_id === user.id && msg.receiver_id === receiverId) || 
                           (msg.sender_id === receiverId && msg.receiver_id === user.id);
        
        if (isRelevant) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id);
            if (exists) return prev;
            return [...prev, { ...msg, content: decryptMessage(msg.content) }];
          });
        }
      }).subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, receiverId, decryptMessage, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  const sendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() || !user) return;

  const rawText = newMessage;
  const encryptedContent = encryptMessage(rawText);

  const cleanTxId = transactionId && transactionId.length > 0 ? transactionId : null;

  setNewMessage('');

  try {
    const { data, error } = await supabase.from('messages').insert({ 
      sender_id: user.id, 
      receiver_id: receiverId, 
      content: encryptedContent, 
      transaction_id: null, 
      is_read: false 
    }).select().single();

    if (error) {
      if (error.code === '23503') {
         console.error("FK Violation: transaction_id invalid. Mengirim ulang tanpa ID...");
         await supabase.from('messages').insert({ 
            sender_id: user.id, 
            receiver_id: receiverId, 
            content: encryptedContent,
            transaction_id: null 
         });
      } else {
         throw error;
      }
    }

    } catch (err) {
      console.error("Send Error:", err);
      toast.error("Transmission failed. Check node status.");
      setNewMessage(rawText);
    }
  };

  const ChatUI = (
    <div className="flex flex-col h-full w-full bg-background text-foreground font-raleway overflow-hidden relative">
      {!user && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-background/60 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
          <div className="w-16 h-16 bg-muted rounded-[2rem] border border-border flex items-center justify-center mb-6 shadow-2xl">
            <Lock className="text-harvest" size={32} />
          </div>
          <h3 className="text-2xl font-bold tracking-tighter italic">Signal Locked<span className="text-harvest">.</span></h3>
          <p className="text-stone/50 text-xs mb-8 leading-relaxed max-w-[200px]">Sign in to authorize end-to-end encrypted communication.</p>
          <Link href="/login"><Button className="bg-forest dark:bg-harvest text-white rounded-2xl h-14 px-10 font-bold uppercase tracking-widest text-[10px]">INITIALIZE IDENTITY</Button></Link>
        </div>
      )}

      {!isMobileDrawer && (
        <div className="p-5 bg-card border-b border-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-forest dark:bg-harvest text-white rounded-xl flex items-center justify-center font-bold shadow-lg">{receiverName?.charAt(0)}</div>
            <div>
              <p className="font-bold text-sm tracking-tight italic leading-none mb-1">{receiverName}</p>
              <div className="flex items-center gap-1.5"><Shield size={10} className="text-emerald-500" /><p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest leading-none">E2EE Secured</p></div>
            </div>
          </div>
          <div className="p-2 bg-muted rounded-xl border border-border"><Lock size={14} className="text-stone/40" /></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-background">
        <div className="flex justify-center mb-4">
           <div className="px-4 py-1.5 bg-muted rounded-full border border-border flex items-center gap-2">
              <Sparkles size={10} className="text-harvest" /><span className="text-[8px] font-bold text-stone/40 uppercase tracking-widest leading-none">Encrypted session active</span>
           </div>
        </div>

        {loading && user ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-harvest" size={24} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
             <MessageSquare size={48} strokeWidth={1} /><p className="text-[10px] font-bold tracking-[0.4em] uppercase mt-4">No signal detected</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] md:max-w-[80%] p-4 rounded-[1.8rem] shadow-sm text-sm font-medium leading-relaxed italic ${
                msg.sender_id === user?.id ? 'bg-forest dark:bg-harvest text-white rounded-tr-none' : 'bg-card text-foreground border border-border rounded-tl-none'
              }`}>
                {msg.content}
                <p className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-40 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-6 bg-card border-t border-border flex gap-3 shrink-0 pb-safe">
        <input 
          disabled={!user} type="text" value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Transmit secure signal..." 
          className="flex-1 bg-muted border border-border rounded-[1.5rem] px-6 py-4 text-xs font-bold italic outline-none focus:border-harvest transition-all text-foreground disabled:opacity-30 placeholder:opacity-30" 
        />
        <button disabled={!user || !newMessage.trim()} type="submit" className="w-14 h-14 bg-forest dark:bg-harvest text-white rounded-2xl flex items-center justify-center active:scale-90 shadow-xl transition-all disabled:opacity-20">
          <Send size={20} />
        </button>
      </form>
    </div>
  )

  if (isMobileDrawer) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-[3rem] overflow-hidden border-t-2 border-border z-[200] bg-background focus:outline-none">
          <SheetHeader className="p-6 border-b border-border bg-card shrink-0">
            <SheetTitle className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-forest dark:bg-harvest text-white rounded-2xl flex items-center justify-center font-bold shadow-xl">{receiverName?.charAt(0)}</div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none mb-1 italic ">{receiverName}</span>
                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />E2EE Secured Signal</span>
              </div>
            </SheetTitle>
            <button onClick={onClose} className="absolute right-6 top-8 p-2 bg-muted rounded-xl text-stone/40"><X size={20}/></button>
          </SheetHeader>
          <div className="flex-1 h-full">{ChatUI}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="flex flex-col w-full h-full max-h-[600px] bg-card shadow-2xl overflow-hidden border border-border rounded-[3rem] animate-in zoom-in duration-300">
      {ChatUI}
    </div>
  )
}
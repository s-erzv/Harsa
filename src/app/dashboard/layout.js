"use client"
import React, { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }) {
  const { user, isInitialLoad, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialLoad && !user) {
      router.push('/login')
    }
  }, [user, isInitialLoad, router])

  if (isInitialLoad) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="animate-spin text-harvest mb-4" size={40} />
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40 italic">Authenticating Node...</p>
      </div>
    )
  }

  if (!user) return null

  return ( 
    <div className="h-screen flex bg-background text-foreground font-raleway overflow-hidden transition-colors duration-500">
      <Sidebar logout={logout} />
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-background"> 
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-12 p-4 md:p-10 animate-in fade-in duration-700">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
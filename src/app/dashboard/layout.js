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
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground transition-all duration-500">
        <div className="relative">
          <Loader2 className="animate-spin text-harvest mb-4" size={40} />
          <div className="absolute inset-0 blur-xl bg-harvest/20 animate-pulse rounded-full" />
        </div>
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40 italic animate-pulse">
          Synchronizing Node...
        </p>
      </div>
    )
  }

  if (!user) return null

  return ( 
    <div className="h-screen flex bg-background text-foreground font-raleway overflow-hidden transition-colors duration-500">
      <Sidebar logout={logout} />
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-background"> 
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-12 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
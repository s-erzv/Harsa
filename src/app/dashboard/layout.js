"use client"
import React from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/context/AuthContext'

export default function DashboardLayout({ children }) {
  const { logout } = useAuth()

  return ( 
    <div className="h-screen flex bg-background text-foreground font-raleway overflow-hidden transition-colors duration-500">
      <Sidebar logout={logout} />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-background"> 
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-12 p-4 md:p-10 animate-in fade-in duration-700">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-forest/5 dark:bg-harvest/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-harvest/5 dark:bg-forest/5 rounded-full blur-[100px]" />
        </div>
      </main>
    </div>
  )
}
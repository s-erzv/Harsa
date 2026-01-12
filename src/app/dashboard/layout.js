"use client"
import React from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/context/AuthContext'
import OnboardingModal from '@/components/OnboardingModal'

export default function DashboardLayout({ children }) {
  const { logout } = useAuth()

  return ( 
    <div className="h-screen flex bg-slate-50 font-raleway overflow-hidden">
      <OnboardingModal /> 
      <Sidebar logout={logout} />
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-white"> 
        <div className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
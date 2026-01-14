"use client"
import React, { useState, useEffect } from 'react'
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  ShieldCheck, Zap, Wallet 
} from 'lucide-react'
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    title: "Welcome to Harsa",
    description: "Your gateway to a decentralized agricultural ecosystem. Let's get you familiar with your operative node.",
    icon: <Sparkles className="text-harvest" size={40} />,
  },
  {
    title: "Secure Transactions",
    description: "Every deal is protected by our L2 Escrow Protocol. Funds only move when both parties are satisfied.",
    icon: <ShieldCheck className="text-forest" size={40} />,
  },
  {
    title: "On-Chain Analytics",
    description: "Monitor market price indices and your business growth with real-time global protocol data.",
    icon: <Zap className="text-harvest" size={40} />,
  },
  {
    title: "Direct Acquisition",
    description: "Buy or Sell agricultural assets directly using ETH with gas-optimized protocols built for the future.",
    icon: <Wallet className="text-forest" size={40} />,
  }
]

export default function OnboardingModal({ forceOpen = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('harsa_onboarding_seen')
    
    if (!hasSeenOnboarding || forceOpen) {
      setIsOpen(true)
    }
  }, [forceOpen])

  const handleClose = () => {
    localStorage.setItem('harsa_onboarding_seen', 'true')
    setIsOpen(false)
    setCurrentStep(0)
    if (onClose) onClose()
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6">
      <div 
        className="absolute inset-0 bg-forest/20 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={handleClose} 
      />
      
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-clay/20 p-8 md:p-10 font-raleway animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${idx <= currentStep ? 'bg-forest' : 'bg-clay/20'}`} 
            />
          ))}
        </div>

        <button 
          onClick={handleClose}
          className="absolute top-8 right-8 text-stone/30 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 min-h-[280px] justify-center">
          <div className="w-24 h-24 bg-chalk rounded-[2.5rem] flex items-center justify-center shadow-inner border border-clay/10 animate-in zoom-in duration-700 delay-150">
            {STEPS[currentStep].icon}
          </div>
          
          <div className="space-y-3 px-2">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight leading-tight uppercase">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-sm md:text-base text-stone/50 leading-relaxed font-medium">
              {STEPS[currentStep].description}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button 
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
            className={`flex items-center justify-center w-14 h-14 rounded-2xl border border-clay/30 text-stone transition-all active:scale-90 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-chalk'}`}
          >
            <ChevronLeft size={24} />
          </button>

          <Button 
            onClick={nextStep}
            className="flex-1 h-14 rounded-2xl bg-forest hover:bg-forest/90 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-forest/20 active:scale-95 transition-all"
          >
            {currentStep === STEPS.length - 1 ? "Initialize" : "Continue"}
            <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-clay/10 flex justify-center">
            <p className="text-[10px] text-stone/30 font-bold uppercase tracking-[0.3em]">
              Harsa.
            </p>
        </div>
      </div>
    </div>
  )
}
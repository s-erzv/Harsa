"use client"
import React, { useState, useEffect } from 'react'
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  ShieldCheck, Zap, Wallet, Globe, Layers
} from 'lucide-react'
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    title: "Welcome to Harsa",
    description: "Initialize your connection to the poetic supply chain. A decentralized ecosystem where every harvest tells a story.",
    icon: <Sparkles className="text-harvest" size={42} />,
    badge: "Identity Genesis"
  },
  {
    title: "L2 Escrow Protocol",
    description: "Every deal is cryptographically secured. Funds are held in smart contracts and only flow when the hand-off is verified.",
    icon: <ShieldCheck className="text-forest dark:text-emerald-400" size={42} />,
    badge: "Immutable Trust"
  },
  {
    title: "Live Market Logic",
    description: "Monitor real-time commodity indices and node growth with clean, on-chain data visualizations.",
    icon: <Zap className="text-harvest" size={42} />,
    badge: "Protocol Intelligence"
  },
  {
    title: "Direct Acquisition",
    description: "Execute trades directly using ETH. Optimized for the Arbitrum network with negligible gas fees.",
    icon: <Wallet className="text-forest dark:text-emerald-400" size={42} />,
    badge: "Atomic Settlement"
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 transition-colors duration-500">
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-xl animate-in fade-in duration-700" 
        onClick={handleClose} 
      />
      
      <div className="relative bg-card w-full max-w-lg rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl border border-border p-10 md:p-14 font-raleway animate-in zoom-in-95 slide-in-from-bottom-8 duration-700">
        
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12 -z-10">
           <Globe size={300} />
        </div>

        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-2 flex-1 max-w-[120px]">
            {STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${idx === currentStep ? 'bg-harvest w-6' : idx < currentStep ? 'bg-forest dark:bg-emerald-500' : 'bg-muted'}`} 
              />
            ))}
          </div>
          <button 
            onClick={handleClose}
            className="p-2.5 bg-muted rounded-2xl text-stone/40 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-8 min-h-[320px] justify-center">
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-harvest/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-28 h-28 bg-muted rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center shadow-inner border border-border relative z-10 animate-in zoom-in duration-700 delay-150">
              {STEPS[currentStep].icon}
            </div>
          </div>
          
          <div className="space-y-4 px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-harvest/10 border border-harvest/20 text-harvest text-[9px] font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-top-2 duration-500">
               <Layers size={10} />
               {STEPS[currentStep].badge}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter italic leading-[0.9] lowercase text-foreground">
              {STEPS[currentStep].title}<span className="text-harvest">.</span>
            </h2>
            <p className="text-sm md:text-lg text-stone/50 leading-relaxed font-medium max-w-xs mx-auto italic">
              {STEPS[currentStep].description}
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between gap-5">
          <button 
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
            className={`flex items-center justify-center w-16 h-16 rounded-3xl border-2 border-border text-stone/40 transition-all active:scale-90 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'hover:border-harvest hover:text-harvest'}`}
          >
            <ChevronLeft size={28} />
          </button>

          <Button 
            onClick={nextStep}
            className="flex-1 h-16 rounded-3xl bg-forest dark:bg-harvest text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-forest/20 dark:shadow-harvest/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {currentStep === STEPS.length - 1 ? "Initialize Protocol" : "Authorize Next"}
            <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex justify-center opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">
              Harsa Node Protocol v0.1
            </p>
        </div>
      </div>
    </div>
  )
}
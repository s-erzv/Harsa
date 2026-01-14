"use client"
import React from 'react'
import { 
  ArrowUpRight, Package, ShoppingBag, 
  Truck, CheckCircle2, Clock, ArrowRight 
} from 'lucide-react'

export default function BlockchainActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="w-full p-12 text-center bg-card rounded-[2.5rem] border border-border border-dashed">
        <p className="text-stone/30 italic text-sm font-medium">No recorded ledger activity for this asset yet.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-4 md:px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-harvest/10 rounded-lg text-harvest">
            <Clock size={18} />
          </div>
          <h3 className="text-sm font-bold tracking-[0.15em] text-stone/60 italic">
            Asset Provenance
          </h3>
        </div>
        <span className="text-[10px] font-bold text-stone/30 tracking-widest bg-muted px-3 py-1 rounded-full border border-border">
          {activities.length} Events
        </span>
      </div>

      <div className="hidden md:block w-full bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 text-[10px] font-bold text-stone/40 tracking-[0.2em] border-b border-border">
              <th className="px-8 py-5">Event Type</th>
              <th className="px-8 py-5">Volume & Value</th>
              <th className="px-8 py-5">Node Flow</th>
              <th className="px-8 py-5 text-right">Time & Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {activities.map((act) => (
              <tr key={act.id} className="group hover:bg-muted/20 transition-all duration-300">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <ActivityIcon status={act.status} />
                    <span className="font-bold text-sm italic text-forest dark:text-clay">
                      {act.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="font-bold text-sm tracking-tight text-foreground">Ξ {act.amount_paid || '0.00'}</p>
                    <p className="text-[10px] font-bold text-stone/40 tracking-widest">{act.amount_kg} KG Asset</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-stone/30 leading-none mb-1">From</span>
                      <span className="text-xs font-mono font-bold text-harvest">{act.seller?.wallet_address?.slice(0, 6)}...</span>
                    </div>
                    <ArrowRight size={12} className="text-stone/20" />
                    <div className="flex flex-col text-right md:text-left">
                      <span className="text-[9px] font-bold text-stone/30 leading-none mb-1">To</span>
                      <span className="text-xs font-mono font-bold text-forest dark:text-clay">
                        {act.buyer?.wallet_address ? `${act.buyer.wallet_address.slice(0, 6)}...` : '---'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-xs font-medium text-stone/40 italic">
                      {new Date(act.created_at).toLocaleDateString()}
                    </span>
                    <a href={`https://sepolia.arbiscan.io/tx/${act.tx_hash}`} target="_blank" rel="noreferrer" className="p-2.5 bg-background border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-harvest/10 hover:text-harvest shadow-sm">
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="bg-card rounded-[2rem] border border-border p-6 space-y-5 shadow-sm active:scale-[0.98] transition-transform text-left">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <ActivityIcon status={act.status} />
                <div>
                  <p className="font-bold text-sm italic capitalize">{act.status.toLowerCase().replace('_', ' ')}</p>
                  <p className="text-[10px] text-stone/40 font-medium italic">{new Date(act.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <a href={`https://sepolia.arbiscan.io/tx/${act.tx_hash}`} target="_blank" rel="noreferrer" className="p-2 bg-muted rounded-lg text-stone/40">
                <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-stone/30 tracking-widest">Value</p>
                <p className="font-bold text-sm text-harvest">Ξ {act.amount_paid}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-bold text-stone/30 tracking-widest">Volume</p>
                <p className="font-bold text-sm">{act.amount_kg} KG</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-bold text-stone/30 mb-1">Source</span>
                <span className="text-[11px] font-mono font-bold text-harvest truncate">{act.seller?.wallet_address?.slice(0, 6)}...</span>
              </div>
              <ArrowRight size={14} className="text-stone/20 shrink-0" />
              <div className="flex flex-col text-right min-w-0">
                <span className="text-[8px] font-bold text-stone/30 mb-1">Target</span>
                <span className="text-[11px] font-mono font-bold text-forest dark:text-clay truncate">
                   {act.buyer?.wallet_address ? `${act.buyer.wallet_address.slice(0, 6)}...` : '---'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityIcon({ status }) {
  if (status === 'COMPLETE') return <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={16}/></div>
  if (status === 'SHIPPED') return <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl"><Truck size={16}/></div>
  if (status === 'AWAITING_DELIVERY') return <div className="p-2.5 bg-harvest/10 text-harvest rounded-xl"><ShoppingBag size={16}/></div>
  return <div className="p-2.5 bg-stone-500/10 text-stone rounded-xl"><Package size={16}/></div>
}
import React from 'react'
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react'

const statusConfig = {
  green: {
    bg: 'bg-[#10B981]/10',
    text: 'text-[#10B981]',
    border: 'border-[#10B981]/20',
    icon: CheckCircle2
  },
  yellow: {
    bg: 'bg-[#F59E0B]/10',
    text: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/20',
    icon: Clock
  },
  red: {
    bg: 'bg-[#EF4444]/10',
    text: 'text-[#EF4444]',
    border: 'border-[#EF4444]/20',
    icon: AlertCircle
  },
  default: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    icon: HelpCircle
  }
}

export function Badge({ children, variant = 'default', className = '' }) {
  const config = statusConfig[variant] || statusConfig.default
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ${config.bg} ${config.text} ${config.border} ${className}`}>
      <Icon size={14} className="opacity-80" />
      {children}
    </span>
  )
}

import React from 'react'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = "inline-flex items-center justify-center h-12 px-6 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090B]"
  
  const variants = {
    primary: "bg-[#7C3AED] text-white hover:bg-[#8B5CF6] shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] focus:ring-[#7C3AED]",
    secondary: "bg-[#171717] text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[#262626] focus:ring-[#A1A1AA]"
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

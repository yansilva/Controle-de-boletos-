import React, { forwardRef } from 'react'

export const Input = forwardRef(function Input({ icon: Icon, className = '', style, ...props }, ref) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#7C3AED] transition-colors duration-200 pointer-events-none">
          <Icon size={16} />
        </div>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl h-11 text-sm text-white placeholder-[#A1A1AA] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] hover:border-[rgba(255,255,255,0.15)] ${className}`}
        style={{ paddingLeft: Icon ? '2.5rem' : '0.875rem', paddingRight: '0.875rem', ...(style || {}) }}
      />
    </div>
  )
})

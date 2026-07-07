import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-[#171717] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${className}`} {...props}>
      {children}
    </div>
  )
}

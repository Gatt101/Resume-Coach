import React from 'react'

export default function HeroBackdrop({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-br from-[#0b0b12] via-[#0b0b12] to-[#121223] p-6 md:p-8 ${className}`}>
      <div className="absolute -top-24 -right-20 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-24 size-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

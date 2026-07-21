import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Light-only glass-morphism container — translucent surface with a soft blur and border. */
export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'shadow-soft-lg rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

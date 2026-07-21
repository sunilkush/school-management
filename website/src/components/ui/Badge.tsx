import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'dark' | 'success' | 'warning' | 'error' | 'neutral'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary-50 text-primary',
  dark: 'bg-dark text-secondary-300',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-black/5 text-gray',
}

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  icon?: ReactNode
  className?: string
}

export function Badge({ children, tone = 'primary', icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        toneClasses[tone],
        className,
      )}
    >
      {icon && <span className="inline-flex">{icon}</span>}
      {children}
    </span>
  )
}

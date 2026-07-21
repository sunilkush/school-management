import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PhoneMockupProps {
  children: ReactNode
  className?: string
}

/** CSS-only phone frame — no image assets, no App Store trademark badges. */
export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div
      className={cn(
        'shadow-soft-lg bg-dark relative mx-auto aspect-[9/19] w-64 rounded-[2.75rem] border-[6px] border-black p-2',
        className,
      )}
      aria-hidden="true"
    >
      <div className="bg-dark absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full" />
      <div className="h-full w-full overflow-hidden rounded-[2rem] bg-white">{children}</div>
    </div>
  )
}

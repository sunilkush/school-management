import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverLift?: boolean
}

export function Card({ children, className, hoverLift = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'shadow-soft rounded-2xl border border-black/5 bg-white p-6',
        hoverLift &&
          'transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgb(2_2_2_/_0.1)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

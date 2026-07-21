import type { IconType } from 'react-icons'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 'h-4 w-4' },
  md: { box: 'h-12 w-12 rounded-xl', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-6 w-6' },
}

interface IconBadgeProps {
  icon: IconType
  color?: string
  size?: Size
  className?: string
}

export function IconBadge({ icon: Icon, color = 'var(--color-primary)', size = 'md', className }: IconBadgeProps) {
  const { box, icon } = sizeClasses[size]
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center', box, className)}
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      <Icon className={icon} aria-hidden="true" />
    </span>
  )
}

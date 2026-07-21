import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps {
  children: ReactNode
  className?: string
  durationSeconds?: number
}

/**
 * Pure-CSS infinite scroll strip (no JS-driven animation) — pauses on hover
 * and respects prefers-reduced-motion via the global override in index.css.
 */
export function Marquee({ children, className, durationSeconds = 28 }: MarqueeProps) {
  return (
    <div className={cn('group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]', className)}>
      <div
        className="flex w-max items-center gap-12 group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee ${durationSeconds}s linear infinite` }}
      >
        <div className="flex items-center gap-12">{children}</div>
        {/* Visual-loop duplicate only — hidden from assistive tech so names aren't announced twice. */}
        <div className="flex items-center gap-12" aria-hidden="true">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

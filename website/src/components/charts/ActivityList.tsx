import type { IconType } from 'react-icons'
import { motion } from 'framer-motion'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'

export interface ActivityItem {
  id: string
  icon: IconType
  text: string
  time: string
  color?: string
}

/** Illustrative "recent activity" feed — decorative, not driven by real data. */
export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <motion.ul
      className="flex flex-col gap-3"
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={staggerContainer(0.08)}
    >
      {items.map((item) => {
        const Icon = item.icon
        const color = item.color ?? 'var(--color-primary)'
        return (
          <motion.li key={item.id} className="flex items-center gap-3" variants={fadeUp}>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-dark truncate text-sm font-medium">{item.text}</p>
              <p className="text-gray text-xs">{item.time}</p>
            </div>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

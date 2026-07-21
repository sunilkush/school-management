import type { IconType } from 'react-icons'
import { motion } from 'framer-motion'
import { defaultViewport } from '@/lib/motion'

export interface NotificationItem {
  id: string
  icon: IconType
  title: string
  subtitle: string
  color?: string
}

/** Illustrative cascading notification stack — decorative, not driven by real data. */
export function NotificationStack({ items }: { items: NotificationItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const Icon = item.icon
        const color = item.color ?? 'var(--color-primary)'
        return (
          <motion.div
            key={item.id}
            className="shadow-soft flex items-center gap-3 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur-sm"
            initial={{ opacity: 0, x: 16, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={defaultViewport}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-dark truncate text-sm font-semibold">{item.title}</p>
              <p className="text-gray truncate text-xs">{item.subtitle}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FloatingCardProps {
  children: ReactNode
  className?: string
  delay?: number
  floatDuration?: number
}

/** A glass card that fades in then gently bobs in place — for the Hero's floating analytics cards. */
export function FloatingCard({ children, className, delay = 0, floatDuration = 5 }: FloatingCardProps) {
  return (
    <motion.div
      className={cn(
        'shadow-soft-lg absolute rounded-2xl border border-white/60 bg-white/85 p-4 backdrop-blur-xl',
        className,
      )}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -10, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        y: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 },
      }}
    >
      {children}
    </motion.div>
  )
}

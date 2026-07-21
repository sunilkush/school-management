import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { defaultViewport, fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  tone?: 'light' | 'dark'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'light',
  className,
}: SectionHeadingProps) {
  const isDark = tone === 'dark'

  return (
    <motion.div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={fadeUp}
    >
      {eyebrow && (
        <span
          className={cn(
            'font-heading text-xs font-bold tracking-[0.14em] uppercase',
            isDark ? 'text-secondary-300' : 'text-primary',
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'font-display text-3xl font-bold text-balance sm:text-4xl lg:text-[2.75rem]',
          isDark && 'text-white',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'max-w-2xl text-base leading-relaxed sm:text-lg',
            isDark ? 'text-white/60' : 'text-gray',
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { LOGO_GRADIENT_COLORS } from '@/config/brandColors'

const BRAND_CONIC_GRADIENT = `conic-gradient(from 180deg, ${LOGO_GRADIENT_COLORS.join(', ')}, ${LOGO_GRADIENT_COLORS[0]})`

/** Soft, slow-drifting gradient blobs behind the hero — purely decorative. */
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-48 -left-40 h-[30rem] w-[30rem] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: BRAND_CONIC_GRADIENT }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0], rotate: [0, 20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-20 -right-24 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-secondary-300), transparent 70%)' }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-dark) 1px, transparent 1px), linear-gradient(90deg, var(--color-dark) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}

import { motion } from 'framer-motion'

/** Soft, slow-drifting gradient blobs behind the hero — purely decorative. */
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-primary-200), transparent 70%)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
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

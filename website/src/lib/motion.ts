import type { Variants } from 'framer-motion'

/**
 * Shared scroll-reveal viewport config — trip once, a bit before the element
 * is fully in view, so reveals feel anticipatory rather than laggy.
 */
export const defaultViewport = { once: true, margin: '-80px' } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

/** Wrap a set of children with this on the parent to stagger their reveal. */
export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
})

export const hoverLift = {
  whileHover: { y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  whileTap: { y: -2 },
}

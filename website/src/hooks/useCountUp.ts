import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

/**
 * Animates a number from 0 up to `target` once the returned ref scrolls into
 * view. Respects prefers-reduced-motion by jumping straight to the final
 * value instead of animating.
 */
export function useCountUp(target: number, duration = 1.6) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    if (shouldReduceMotion) {
      setValue(target)
      return
    }

    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(Math.round(latest)),
    })

    return () => controls.stop()
  }, [isInView, target, duration, shouldReduceMotion])

  return { ref, value }
}

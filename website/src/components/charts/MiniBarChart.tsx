import { motion } from 'framer-motion'
import { defaultViewport, staggerContainer } from '@/lib/motion'

interface MiniBarChartProps {
  data: number[]
  height?: number
  color?: string
  activeIndex?: number
  activeColor?: string
  className?: string
}

/** Illustrative animated bar chart — decorative, not driven by real data. */
export function MiniBarChart({
  data,
  height = 80,
  color = 'var(--color-primary-200)',
  activeIndex,
  activeColor = 'var(--color-primary)',
  className,
}: MiniBarChartProps) {
  const max = Math.max(...data, 1)

  return (
    <motion.div
      className={`flex items-end gap-1.5 ${className ?? ''}`}
      style={{ height }}
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={staggerContainer(0.06)}
    >
      {data.map((value, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full"
          style={{
            background: i === activeIndex ? activeColor : color,
            transformOrigin: 'bottom',
          }}
          variants={{
            hidden: { scaleY: 0 },
            show: {
              scaleY: value / max,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        />
      ))}
    </motion.div>
  )
}

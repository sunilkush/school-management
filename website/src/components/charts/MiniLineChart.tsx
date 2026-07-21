import { motion } from 'framer-motion'
import { buildAreaPath, buildLinePath } from './chartMath'
import { defaultViewport } from '@/lib/motion'

interface MiniLineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

/** Illustrative animated line/area chart — decorative, not driven by real data. */
export function MiniLineChart({
  data,
  width = 200,
  height = 80,
  color = 'var(--color-primary)',
  className,
}: MiniLineChartProps) {
  const linePath = buildLinePath(data, width, height)
  const areaPath = buildAreaPath(data, width, height)
  const gradientId = `line-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Illustrative trend chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={defaultViewport}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={defaultViewport}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

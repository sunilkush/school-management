import { motion } from 'framer-motion'
import { defaultViewport } from '@/lib/motion'

interface MiniDonutChartProps {
  value: number // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  className?: string
}

/** Illustrative animated progress ring — decorative, not driven by real data. */
export function MiniDonutChart({
  value,
  size = 96,
  strokeWidth = 10,
  color = 'var(--color-primary)',
  trackColor = 'var(--color-primary-100)',
  label,
  className,
}: MiniDonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `${clamped}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          viewport={defaultViewport}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold text-dark">{clamped}%</span>
      </div>
    </div>
  )
}

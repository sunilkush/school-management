import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({ value, prefix = '', suffix = '', className }: AnimatedCounterProps) {
  const { ref, value: current } = useCountUp(value)

  return (
    <span ref={ref} className={cn('font-display tabular-nums', className)}>
      {prefix}
      {current.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

import { motion } from 'framer-motion'
import { HiOutlineCheck } from 'react-icons/hi2'
import { Button } from '@/components/ui/Button'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DEMO_BOOKING_URL, FREE_TRIAL_URL } from '@/config/links'
import type { PricingPlan } from '@/types/content'

const periodLabel = (days: number) => (days <= 31 ? `${days} days` : 'year')

export function PlanCard({ plan }: { plan: PricingPlan }) {
  const href = plan.isTrial ? FREE_TRIAL_URL : plan.id === 'enterprise' ? DEMO_BOOKING_URL : FREE_TRIAL_URL

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'relative flex flex-col gap-6 rounded-3xl border p-8',
        plan.highlighted
          ? 'border-primary shadow-soft-lg bg-primary text-white'
          : 'shadow-soft border-black/5 bg-white',
      )}
    >
      {plan.highlighted && (
        <span className="bg-secondary text-primary-900 absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap">
          Most Popular
        </span>
      )}

      <div>
        <h3 className={cn('font-heading text-lg font-bold', plan.highlighted ? 'text-white' : 'text-dark')}>
          {plan.name}
        </h3>
        <p className={cn('mt-1 text-sm', plan.highlighted ? 'text-white/70' : 'text-gray')}>{plan.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-bold">
          {plan.isFree ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
        </span>
        {!plan.isFree && (
          <span className={cn('text-sm', plan.highlighted ? 'text-white/70' : 'text-gray')}>
            / {periodLabel(plan.billingPeriodDays)}
          </span>
        )}
      </div>

      <Button
        href={href}
        variant={plan.highlighted ? 'secondary' : 'primary'}
        className={cn('w-full', plan.highlighted && 'bg-white text-primary hover:bg-white/90')}
      >
        {plan.ctaLabel}
      </Button>

      <ul className="flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                plan.highlighted ? 'bg-white/15' : 'bg-success/10 text-success',
              )}
            >
              <HiOutlineCheck className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className={cn('text-sm', plan.highlighted ? 'text-white/90' : 'text-dark')}>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { PlanCard } from '@/components/pricing/PlanCard'
import { CompareTable } from '@/components/pricing/CompareTable'
import { defaultViewport, staggerContainer } from '@/lib/motion'
import { PRICING_PLANS } from '@/data/pricingPlans'

interface PricingSectionProps {
  showCompareTable?: boolean
}

export function PricingSection({ showCompareTable = false }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <Container className="flex flex-col gap-16">
        <SectionHeading
          eyebrow="Simple Pricing"
          title="Plans that scale with your institution"
          description="Start free, upgrade when you need to. No hidden fees, no surprise invoices."
        />

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.08)}
        >
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </motion.div>

        {showCompareTable && (
          <div className="flex flex-col gap-8">
            <SectionHeading title="Compare plans in detail" />
            <CompareTable />
          </div>
        )}
      </Container>
    </section>
  )
}

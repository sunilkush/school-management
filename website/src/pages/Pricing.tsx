import { SEO } from '@/components/seo/SEO'
import { PricingSection } from '@/components/sections/PricingSection'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Accordion } from '@/components/ui/Accordion'
import { FAQ_ITEMS } from '@/data/faq'

const PRICING_FAQ_IDS = ['switch-plans', 'trial-commitment', 'payments', 'setup-time']
const pricingFaqItems = FAQ_ITEMS.filter((item) => PRICING_FAQ_IDS.includes(item.id))

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing"
        description="Simple, transparent pricing for schools, colleges, and coaching institutes of every size."
      />
      <PricingSection showCompareTable />

      <section className="pb-20 sm:pb-28">
        <Container className="mx-auto flex max-w-3xl flex-col gap-12">
          <SectionHeading title="Pricing questions" />
          <Accordion items={pricingFaqItems} />
        </Container>
      </section>

      <FinalCTA />
    </>
  )
}

import { SEO } from '@/components/seo/SEO'
import { useScrollToHash } from '@/hooks/useScrollToHash'
import { Hero } from '@/components/sections/Hero'
import { TrustSection } from '@/components/sections/TrustSection'
import { WhyChooseUs } from '@/components/sections/WhyChooseUs'
import { ModulesSection } from '@/components/sections/ModulesSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { DashboardPreview } from '@/components/sections/DashboardPreview'
import { MobileAppSection } from '@/components/sections/MobileAppSection'
import { AIFeaturesSection } from '@/components/sections/AIFeaturesSection'
import { IntegrationsSection } from '@/components/sections/IntegrationsSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { PricingSection } from '@/components/sections/PricingSection'
import { FAQSection } from '@/components/sections/FAQSection'
import { FinalCTA } from '@/components/sections/FinalCTA'

export default function Home() {
  useScrollToHash()

  return (
    <>
      <SEO
        title="Modern School Management Software"
        description="CodeVariant School ERP is a premium, all-in-one school management platform for schools, colleges, coaching institutes, and universities."
      />
      <Hero />
      <TrustSection />
      <WhyChooseUs />
      <ModulesSection />
      <FeaturesSection />
      <DashboardPreview />
      <MobileAppSection />
      <AIFeaturesSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </>
  )
}

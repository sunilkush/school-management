import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { IconBadge } from '@/components/ui/IconBadge'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { brandIconColor } from '@/config/brandColors'
import { BENEFITS } from '@/data/benefits'

export function WhyChooseUs() {
  return (
    <section id="why-us" className="py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Why CodeVariant"
          title="Built for how schools actually run"
          description="Every feature is designed around real administrative workflows — not a generic template stretched to fit education."
        />

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.08)}
        >
          {BENEFITS.map((benefit, index) => (
            <motion.div key={benefit.id} variants={fadeUp}>
              <Card hoverLift className="flex h-full flex-col gap-4">
                <IconBadge icon={benefit.icon} size="lg" color={brandIconColor(index)} />
                <div>
                  <h3 className="font-heading text-dark mb-2 text-lg font-bold">{benefit.title}</h3>
                  <p className="text-gray text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

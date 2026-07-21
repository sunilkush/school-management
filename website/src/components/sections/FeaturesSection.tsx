import { motion } from 'framer-motion'
import { HiOutlineCheck } from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { IconBadge } from '@/components/ui/IconBadge'
import { IllustrativeMockup } from '@/components/features/IllustrativeMockup'
import { defaultViewport, fadeUp, slideInLeft, slideInRight } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { FLAGSHIP_FEATURES } from '@/data/flagshipFeatures'

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container className="flex flex-col gap-24">
        <SectionHeading
          eyebrow="Flagship Features"
          title="A closer look at what makes the difference"
          description="A handful of features that administrators tell us they can’t work without."
        />

        {FLAGSHIP_FEATURES.map((feature, index) => {
          const isReversed = index % 2 === 1
          return (
            <div
              key={feature.id}
              className={cn(
                'grid items-center gap-12 lg:grid-cols-2 lg:gap-16',
                isReversed && 'lg:[&>*:first-child]:order-2',
              )}
            >
              <motion.div
                className="flex flex-col gap-5"
                initial="hidden"
                whileInView="show"
                viewport={defaultViewport}
                variants={isReversed ? slideInRight : slideInLeft}
              >
                <IconBadge icon={feature.icon} size="lg" />
                <h3 className="font-display text-dark text-2xl font-bold sm:text-3xl">{feature.title}</h3>
                <p className="text-gray text-base leading-relaxed">{feature.description}</p>
                <ul className="flex flex-col gap-3">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <span className="bg-success/10 text-success mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                        <HiOutlineCheck className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-dark text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div initial="hidden" whileInView="show" viewport={defaultViewport} variants={fadeUp}>
                <IllustrativeMockup featureId={feature.id} />
              </motion.div>
            </div>
          )
        })}
      </Container>
    </section>
  )
}

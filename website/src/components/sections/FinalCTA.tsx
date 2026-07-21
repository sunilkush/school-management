import { motion } from 'framer-motion'
import { HiArrowRight } from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { DEMO_BOOKING_URL, FREE_TRIAL_URL } from '@/config/links'

export function FinalCTA() {
  return (
    <section className="bg-dark relative overflow-hidden py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <Container className="relative flex flex-col items-center gap-8 text-center">
        <motion.div
          className="flex flex-col items-center gap-5"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.1)}
        >
          <motion.h2
            variants={fadeUp}
            className="font-display max-w-2xl text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl"
          >
            Ready to bring your entire institution onto one platform?
          </motion.h2>
          <motion.p variants={fadeUp} className="max-w-xl text-base text-white/60 sm:text-lg">
            Start your 14-day free trial today, no credit card required — or book a personalized demo with
            our team.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Button href={FREE_TRIAL_URL} size="lg" icon={<HiArrowRight className="h-4 w-4" />}>
              Start Free Trial
            </Button>
            <Button
              href={DEMO_BOOKING_URL}
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:border-white/40 hover:bg-white/5"
            >
              Book a Demo
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}

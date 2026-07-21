import { motion } from 'framer-motion'
import { HiArrowRight, HiOutlineCheckCircle, HiOutlineSparkles } from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { AnimatedBackground } from '@/components/hero/AnimatedBackground'
import { DashboardMockup } from '@/components/hero/DashboardMockup'
import { FloatingCard } from '@/components/hero/FloatingCard'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { DEMO_BOOKING_URL, FREE_TRIAL_URL } from '@/config/links'
import { HERO_STATS } from '@/data/stats'

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden pt-16 pb-24 sm:pt-20 sm:pb-32">
      <AnimatedBackground />

      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          className="flex flex-col items-start gap-6"
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.12)}
        >
          <motion.div variants={fadeUp}>
            <Badge icon={<HiOutlineSparkles className="h-3.5 w-3.5" />}>All-in-one School ERP</Badge>
          </motion.div>

          <motion.h1
            className="font-display text-dark text-4xl leading-[1.1] font-bold text-balance sm:text-5xl lg:text-[3.4rem]"
            variants={fadeUp}
          >
            Run your entire institution from one beautifully simple platform
          </motion.h1>

          <motion.p className="text-gray max-w-xl text-lg leading-relaxed" variants={fadeUp}>
            CodeVariant brings admissions, fees, attendance, exams, HR, and communication into a single,
            fast, dependable ERP — built for schools, colleges, coaching institutes, and universities.
          </motion.p>

          <motion.div className="flex flex-wrap items-center gap-4" variants={fadeUp}>
            <Button href={FREE_TRIAL_URL} size="lg" icon={<HiArrowRight className="h-4 w-4" />}>
              Start Free Trial
            </Button>
            <Button href={DEMO_BOOKING_URL} variant="outline" size="lg">
              Book a Demo
            </Button>
          </motion.div>

          <motion.ul className="text-gray flex flex-wrap gap-x-6 gap-y-2 text-sm" variants={fadeUp}>
            {['No credit card required', '14-day free trial', 'Setup in a day'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <HiOutlineCheckCircle className="text-success h-4 w-4" aria-hidden="true" />
                {item}
              </li>
            ))}
          </motion.ul>

          <motion.div
            className="mt-4 grid w-full grid-cols-3 gap-6 border-t border-black/8 pt-6"
            variants={fadeUp}
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.id}>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="text-dark text-2xl font-bold sm:text-3xl"
                />
                <p className="text-gray mt-1 text-xs sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative" aria-hidden="true">
          <DashboardMockup />

          <FloatingCard className="top-4 -left-6 hidden w-44 sm:block" delay={0.6}>
            <p className="text-gray text-[11px] font-semibold">Fees Collected</p>
            <p className="font-display text-dark text-lg font-bold">₹24.8L</p>
            <p className="text-success text-xs font-semibold">+12% this month</p>
          </FloatingCard>

          <FloatingCard className="right-0 -bottom-8 hidden w-48 sm:block" delay={0.9} floatDuration={6}>
            <div className="flex items-center gap-2">
              <span className="bg-success/10 text-success flex h-8 w-8 items-center justify-center rounded-full">
                <HiOutlineCheckCircle className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-dark text-xs font-semibold">Attendance Marked</p>
                <p className="text-gray text-[11px]">94% present today</p>
              </div>
            </div>
          </FloatingCard>
        </div>
      </Container>
    </section>
  )
}

import { motion } from 'framer-motion'
import { HiOutlineChatBubbleLeftRight, HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineSignal } from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Marquee } from '@/components/ui/Marquee'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { TRUST_STATS } from '@/data/stats'
import { SAMPLE_INSTITUTIONS } from '@/data/logos'

const TRUST_BADGES = [
  { id: 'encryption', icon: HiOutlineLockClosed, label: 'Bank-grade encryption' },
  { id: 'uptime', icon: HiOutlineSignal, label: '99.9% uptime SLA' },
  { id: 'support', icon: HiOutlineChatBubbleLeftRight, label: '24/7 support' },
  { id: 'privacy', icon: HiOutlineShieldCheck, label: 'Data privacy first' },
]

export function TrustSection() {
  return (
    <section id="trust" className="border-y border-black/5 py-16 sm:py-20">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-6">
          <p className="text-gray text-center text-sm font-semibold">
            Trusted by administrators at institutions of every size
          </p>
          <Marquee>
            {SAMPLE_INSTITUTIONS.map((institution) => (
              <div key={institution.id} className="flex shrink-0 items-center gap-2.5 opacity-60">
                <span className="bg-dark/5 text-dark flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold">
                  {institution.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')}
                </span>
                <span className="font-heading text-dark text-sm font-semibold whitespace-nowrap">
                  {institution.name}
                </span>
              </div>
            ))}
          </Marquee>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-8 border-t border-black/8 pt-12 sm:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.1)}
        >
          {TRUST_STATS.map((stat) => (
            <motion.div key={stat.id} className="text-center" variants={fadeUp}>
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                className="text-primary text-3xl font-bold sm:text-4xl"
              />
              <p className="text-gray mt-1.5 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.id} className="text-gray flex items-center gap-2 text-sm font-medium">
              <badge.icon className="text-primary h-4.5 w-4.5" aria-hidden="true" />
              {badge.label}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

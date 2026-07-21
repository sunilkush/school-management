import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { INTEGRATIONS } from '@/data/integrations'

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Connected"
          title="Works with the tools you already use"
          description="CodeVariant fits into your existing workflow instead of replacing it."
        />

        <motion.div
          className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.05)}
        >
          {INTEGRATIONS.map((integration) => (
            <motion.div
              key={integration.id}
              variants={fadeUp}
              className="shadow-soft relative flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-5"
            >
              {integration.isLive && (
                <span className="bg-success/10 text-success absolute top-3 right-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase">
                  Live
                </span>
              )}
              <integration.icon className="text-dark h-7 w-7" aria-hidden="true" />
              <span className="text-gray text-center text-xs font-semibold">{integration.name}</span>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-gray text-center text-xs">
          All third-party trademarks, logos, and brand names are the property of their respective owners.
        </p>
      </Container>
    </section>
  )
}

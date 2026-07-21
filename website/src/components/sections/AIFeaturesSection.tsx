import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { IconBadge } from '@/components/ui/IconBadge'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import { AI_FEATURES } from '@/data/aiFeatures'

export function AIFeaturesSection() {
  return (
    <section id="ai-features" className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, var(--color-primary-50) 0%, transparent 60%)' }}
        aria-hidden="true"
      />

      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="AI-Powered"
          title="Intelligence built into every workflow"
          description="CodeVariant doesn’t just store your data — it helps you act on it, automatically."
        />

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.07)}
        >
          {AI_FEATURES.map((feature) => (
            <motion.div
              key={feature.id}
              variants={fadeUp}
              className="shadow-soft flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6 transition-transform duration-300 hover:-translate-y-1.5"
            >
              <IconBadge icon={feature.icon} color="var(--color-secondary-600)" size="md" />
              <div>
                <h3 className="font-heading text-dark mb-1.5 text-base font-bold">{feature.title}</h3>
                <p className="text-gray text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

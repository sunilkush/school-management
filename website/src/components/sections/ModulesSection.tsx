import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ModuleCard } from '@/components/modules/ModuleCard'
import { ModuleFilter } from '@/components/modules/ModuleFilter'
import { defaultViewport, staggerContainer } from '@/lib/motion'
import { MODULE_CATEGORIES, MODULES } from '@/data/modules'
import type { ModuleCategory } from '@/types/content'

export function ModulesSection() {
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | 'All'>('All')

  const filteredModules = useMemo(
    () => (activeCategory === 'All' ? MODULES : MODULES.filter((m) => m.category === activeCategory)),
    [activeCategory],
  )

  return (
    <section id="modules" className="bg-primary-50/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Every Module You Need"
          title={`${MODULES.length}+ modules, one connected platform`}
          description="From admissions to alumni, every part of school operations lives under one roof — filter by category to explore."
        />

        <ModuleFilter categories={MODULE_CATEGORIES} active={activeCategory} onChange={setActiveCategory} />

        <motion.div
          key={activeCategory}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={staggerContainer(0.03)}
        >
          {filteredModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

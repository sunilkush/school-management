import { motion } from 'framer-motion'
import { IconBadge } from '@/components/ui/IconBadge'
import { fadeUp } from '@/lib/motion'
import type { Module } from '@/types/content'

interface ModuleCardProps {
  module: Module
  color?: string
}

export function ModuleCard({ module, color }: ModuleCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="shadow-soft group flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(2_2_2_/_0.08)]"
    >
      <IconBadge icon={module.icon} size="sm" color={color} />
      <div>
        <h3 className="font-heading text-dark mb-1 text-sm font-bold">{module.title}</h3>
        <p className="text-gray text-xs leading-relaxed">{module.description}</p>
      </div>
    </motion.div>
  )
}

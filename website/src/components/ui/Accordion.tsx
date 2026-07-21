import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi2'
import { cn } from '@/lib/utils'

export interface AccordionItemData {
  id: string
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItemData[]
  className?: string
}

/** Single-open, keyboard-operable accordion (native <button> gives Enter/Space for free). */
export function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)
  const baseId = useId()

  return (
    <div className={cn('flex flex-col divide-y divide-black/8', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        const panelId = `${baseId}-panel-${item.id}`
        const buttonId = `${baseId}-button-${item.id}`

        return (
          <div key={item.id} className="py-2">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-heading text-dark text-base font-semibold sm:text-lg">
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-primary-50 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <HiChevronDown className="h-4 w-4" aria-hidden="true" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-gray pb-4 leading-relaxed">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

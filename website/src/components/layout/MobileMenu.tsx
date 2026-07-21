import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiXMark } from 'react-icons/hi2'
import { Button } from '@/components/ui/Button'
import { SmartNavLink } from './SmartNavLink'
import { HEADER_NAV } from '@/data/navigation'
import { APP_LOGIN_URL, DEMO_BOOKING_URL, FREE_TRIAL_URL } from '@/config/links'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previouslyFocused.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col gap-8 bg-white p-6 shadow-2xl lg:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-dark text-lg font-bold">CodeVariant</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="text-dark flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5"
              >
                <HiXMark className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Primary">
              {HEADER_NAV.map((link) => (
                <SmartNavLink
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="text-dark font-heading rounded-lg px-3 py-3 text-base font-semibold hover:bg-black/5"
                >
                  {link.label}
                </SmartNavLink>
              ))}
              <a
                href={APP_LOGIN_URL}
                className="text-dark font-heading rounded-lg px-3 py-3 text-base font-semibold hover:bg-black/5"
              >
                Login
              </a>
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              <Button href={DEMO_BOOKING_URL} variant="outline" onClick={onClose}>
                Book a Demo
              </Button>
              <Button href={FREE_TRIAL_URL} variant="primary" onClick={onClose}>
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

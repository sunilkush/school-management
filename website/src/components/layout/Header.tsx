import { useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { HiBars3 } from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { SmartNavLink } from './SmartNavLink'
import { MobileMenu } from './MobileMenu'
import { HEADER_NAV } from '@/data/navigation'
import { APP_LOGIN_URL, DEMO_BOOKING_URL, FREE_TRIAL_URL } from '@/config/links'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 12)
  })

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300"
        style={{
          background: isScrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0)',
          backdropFilter: isScrolled ? 'blur(16px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(2,2,2,0.06)' : '1px solid transparent',
          boxShadow: isScrolled ? '0 4px 24px rgba(2,2,2,0.04)' : 'none',
        }}
      >
        <Container className="flex h-18 items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <span className="font-display text-secondary-300 text-lg font-bold">C</span>
            </span>
            <span className="font-display text-dark text-lg font-bold">CodeVariant</span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {HEADER_NAV.map((link) => (
              <SmartNavLink
                key={link.href}
                href={link.href}
                className="text-gray hover:text-primary font-heading text-sm font-medium transition-colors"
              >
                {link.label}
              </SmartNavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={APP_LOGIN_URL}
              className="text-gray hover:text-primary font-heading text-sm font-semibold transition-colors"
            >
              Login
            </a>
            <Button href={DEMO_BOOKING_URL} variant="outline" size="sm">
              Book a Demo
            </Button>
            <Button href={FREE_TRIAL_URL} variant="primary" size="sm">
              Start Free Trial
            </Button>
          </div>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-dark flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5 lg:hidden"
          >
            <HiBars3 className="h-6 w-6" />
          </button>
        </Container>
      </motion.header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}

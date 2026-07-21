import type { NavLink } from '@/types/content'

/**
 * Header keeps the 6 highest-intent links (Stripe/Linear-style — About/Blog
 * live in the footer, not the primary nav, to keep the bar scannable).
 * Solutions/Features/Modules/Pricing/Resources are anchors on Home; Contact
 * is a real route so it works from anywhere.
 */
export const HEADER_NAV: NavLink[] = [
  { label: 'Solutions', href: '#why-us' },
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#faq' },
  { label: 'Contact', href: '/contact' },
]

export const FOOTER_LINKS = {
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Modules', href: '/#modules' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'AI Features', href: '/#ai-features' },
  ],
  Resources: [
    { label: 'FAQ', href: '/#faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Integrations', href: '/#integrations' },
  ],
  Support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Book a Demo', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
} satisfies Record<string, NavLink[]>

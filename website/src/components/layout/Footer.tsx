import { HiOutlineEnvelope, HiOutlinePhone } from 'react-icons/hi2'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { Container } from '@/components/ui/Container'
import { SmartNavLink } from './SmartNavLink'
import { FOOTER_LINKS } from '@/data/navigation'
import { CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from '@/config/links'

const SOCIAL_ICONS = [
  { icon: FaXTwitter, href: SOCIAL_LINKS.twitter, label: 'X (Twitter)' },
  { icon: FaLinkedinIn, href: SOCIAL_LINKS.linkedin, label: 'LinkedIn' },
  { icon: FaFacebookF, href: SOCIAL_LINKS.facebook, label: 'Facebook' },
  { icon: FaInstagram, href: SOCIAL_LINKS.instagram, label: 'Instagram' },
  { icon: FaYoutube, href: SOCIAL_LINKS.youtube, label: 'YouTube' },
]

export function Footer() {
  return (
    <footer className="bg-dark text-white/70">
      <Container className="grid grid-cols-2 gap-10 py-16 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <a href="/" className="flex items-center gap-2.5">
            <span className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <span className="font-display text-secondary-300 text-lg font-bold">C</span>
            </span>
            <span className="font-display text-lg font-bold text-white">CodeVariant</span>
          </a>
          <p className="max-w-xs text-sm leading-relaxed">
            The all-in-one school ERP for schools, colleges, coaching institutes, and universities.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-secondary-300 flex items-center gap-2">
              <HiOutlineEnvelope className="h-4 w-4 shrink-0" /> {CONTACT_EMAIL}
            </a>
            <a href={`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`} className="hover:text-secondary-300 flex items-center gap-2">
              <HiOutlinePhone className="h-4 w-4 shrink-0" /> {CONTACT_PHONE}
            </a>
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="flex flex-col gap-3">
            <h3 className="font-heading text-xs font-bold tracking-[0.1em] text-white uppercase">{heading}</h3>
            <ul className="flex flex-col gap-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <SmartNavLink href={link.href} className="hover:text-secondary-300 text-sm transition-colors">
                    {link.label}
                  </SmartNavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} CodeVariant School ERP. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {SOCIAL_ICONS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  )
}

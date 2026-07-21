import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface SmartNavLinkProps {
  href: string
  className?: string
  onClick?: () => void
  children: ReactNode
}

/**
 * Handles both anchor links ("#features") and real routes ("/contact")
 * correctly regardless of the current page:
 * - Anchor + already on "/" → smooth-scroll in place.
 * - Anchor + elsewhere → navigate to "/" + hash; Home's useScrollToHash
 *   picks up the hash after mount and scrolls once the page has rendered.
 * - Real route → normal client-side navigation.
 */
export function SmartNavLink({ href, className, onClick, children }: SmartNavLinkProps) {
  const { pathname } = useLocation()

  if (href.startsWith('#')) {
    if (pathname === '/') {
      return (
        <a
          href={href}
          className={className}
          onClick={(event) => {
            event.preventDefault()
            document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
            onClick?.()
          }}
        >
          {children}
        </a>
      )
    }

    return (
      <Link to={`/${href}`} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }

  return (
    <Link to={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

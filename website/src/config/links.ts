/**
 * Single source of truth for every external / CTA destination on the site.
 * Nothing outside this file should hardcode a URL — swapping a real
 * destination in later is a one-file edit, not a repo-wide hunt.
 */

// No live booking/signup infrastructure exists yet — both CTAs route to the
// real, working Contact page rather than a dead "#" link.
export const DEMO_BOOKING_URL = '/contact'
export const FREE_TRIAL_URL = '/contact'

// TODO: point at the real deployed origin of `frontend/` once known.
export const APP_LOGIN_URL = 'https://app.codevariant.example/login'

// TODO: replace with the real access key from https://web3forms.com
// (free, no backend, ~1 minute signup) — read from an env var so it never
// needs a code change to activate.
export const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? ''
export const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

export const CONTACT_EMAIL = 'hello@codevariant.example'
export const CONTACT_PHONE = '+91 90000 00000'

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/codevariant',
  linkedin: 'https://linkedin.com/company/codevariant',
  facebook: 'https://facebook.com/codevariant',
  instagram: 'https://instagram.com/codevariant',
  youtube: 'https://youtube.com/@codevariant',
} as const

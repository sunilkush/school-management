import type { PricingPlan } from '@/types/content'

/**
 * Mirrors the real, active subscription plans configured in the ERP's
 * billing system (Free Trial / Starter / Premium / Enterprise — Growth
 * Plan was deactivated). This is a manually-synced snapshot, not a live
 * API call — keep these numbers in sync if the real plans change.
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free-trial',
    name: 'Free Trial',
    price: 0,
    billingPeriodDays: 14,
    isFree: true,
    isTrial: true,
    tagline: 'Try the full platform, no commitment',
    ctaLabel: 'Start Free Trial',
    limits: { students: 50, teachers: 5, schools: 1 },
    features: [
      'Core academics & attendance',
      'Fee management',
      'Up to 50 students',
      'Email support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 4999,
    billingPeriodDays: 365,
    tagline: 'For a single growing school',
    ctaLabel: 'Get Started',
    limits: { students: 300, teachers: 30, schools: 1 },
    features: [
      'Everything in Free Trial',
      'Up to 300 students',
      'Exams & report cards',
      'Library management',
      'Mobile app access',
      'Email & chat support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 10000,
    billingPeriodDays: 365,
    highlighted: true,
    tagline: 'For established institutions',
    ctaLabel: 'Get Started',
    limits: { students: 1000, teachers: 80, schools: 1 },
    features: [
      'Everything in Starter',
      'Up to 1,000 students',
      'Payroll & HR',
      'Transport & hostel management',
      'WhatsApp & SMS notifications',
      'AI Assistant',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 34999,
    billingPeriodDays: 365,
    tagline: 'For multi-campus institutions',
    ctaLabel: 'Talk to Sales',
    limits: { students: 10000, teachers: 1000, schools: 25 },
    features: [
      'Everything in Premium',
      'Up to 10,000 students',
      'Multi-school & branch management',
      'Advanced analytics & AI insights',
      'Dedicated account manager',
      'Custom onboarding',
    ],
  },
]

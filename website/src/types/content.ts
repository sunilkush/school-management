import type { IconType } from 'react-icons'

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export interface Stat {
  id: string
  value: number
  suffix?: string
  prefix?: string
  label: string
}

export interface Benefit {
  id: string
  icon: IconType
  title: string
  description: string
}

export type ModuleCategory =
  | 'Academics'
  | 'Admissions & Enrollment'
  | 'Finance'
  | 'HR & Staff'
  | 'Communication'
  | 'Facilities & Operations'
  | 'Technology & Apps'
  | 'Intelligence & Administration'

export interface Module {
  id: string
  title: string
  description: string
  category: ModuleCategory
  icon: IconType
}

export type FlagshipFeatureId =
  | 'attendance'
  | 'fees'
  | 'exams'
  | 'timetable'
  | 'communication'
  | 'ai-assistant'
  | 'analytics'

export interface FlagshipFeature {
  id: FlagshipFeatureId
  icon: IconType
  title: string
  description: string
  benefits: string[]
}

export interface Testimonial {
  id: string
  isSample: true
  quote: string
  name: string
  role: string
  institution: string
  rating: number
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  billingPeriodDays: number
  isFree?: boolean
  isTrial?: boolean
  tagline: string
  highlighted?: boolean
  ctaLabel: string
  limits: {
    students: number
    teachers: number
    schools: number
  }
  features: string[]
}

export interface PricingComparisonRow {
  feature: string
  starter: boolean | string
  premium: boolean | string
  enterprise: boolean | string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface Integration {
  id: string
  name: string
  icon: IconType
  isLive: boolean
}

export interface AIFeature {
  id: string
  icon: IconType
  title: string
  description: string
}

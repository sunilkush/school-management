import type { PricingComparisonRow } from '@/types/content'

export const PRICING_COMPARISON_ROWS: PricingComparisonRow[] = [
  { feature: 'Students', starter: 'Up to 300', premium: 'Up to 1,000', enterprise: 'Up to 10,000' },
  { feature: 'Teachers & staff', starter: 'Up to 30', premium: 'Up to 80', enterprise: 'Up to 1,000' },
  { feature: 'Schools / branches', starter: '1', premium: '1', enterprise: 'Up to 25' },
  { feature: 'Fee management', starter: true, premium: true, enterprise: true },
  { feature: 'Attendance & timetable', starter: true, premium: true, enterprise: true },
  { feature: 'Exams & report cards', starter: true, premium: true, enterprise: true },
  { feature: 'Library management', starter: true, premium: true, enterprise: true },
  { feature: 'Transport & hostel', starter: false, premium: true, enterprise: true },
  { feature: 'Payroll & HR', starter: false, premium: true, enterprise: true },
  { feature: 'WhatsApp & SMS notifications', starter: false, premium: true, enterprise: true },
  { feature: 'AI Assistant', starter: false, premium: true, enterprise: true },
  { feature: 'Multi-school management', starter: false, premium: false, enterprise: true },
  { feature: 'Advanced analytics', starter: false, premium: false, enterprise: true },
  { feature: 'API access', starter: false, premium: false, enterprise: true },
  { feature: 'Support', starter: 'Email & chat', premium: 'Priority', enterprise: 'Dedicated manager' },
]

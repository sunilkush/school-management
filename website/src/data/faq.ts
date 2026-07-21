import type { FAQItem } from '@/types/content'

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'setup-time',
    question: 'How long does it take to set up CodeVariant for our school?',
    answer:
      'Most single-campus schools are fully set up — classes, sections, subjects, and staff imported — within a day. Our onboarding team helps with data migration from spreadsheets or your existing system at no extra cost.',
  },
  {
    id: 'existing-data',
    question: 'Can we migrate data from our current system or spreadsheets?',
    answer:
      'Yes. We support importing student, staff, and fee records from Excel/CSV files, and our team can assist with migrating from most common school management tools during onboarding.',
  },
  {
    id: 'multi-campus',
    question: 'Does CodeVariant support multiple schools or campuses?',
    answer:
      'Yes — the Enterprise plan is built for multi-campus institutions, with a unified view across branches and the option to keep each campus’s data independent or shared, depending on how you structure your organization.',
  },
  {
    id: 'security',
    question: 'How is our student and financial data kept secure?',
    answer:
      'All data is encrypted in transit and at rest, access is controlled through granular role-based permissions, and every sensitive action is logged in an audit trail. We never share institutional data with third parties.',
  },
  {
    id: 'payments',
    question: 'What payment methods can parents use to pay fees online?',
    answer:
      'Parents can pay via card, UPI, or net banking directly through the parent app or portal. Payments are reconciled automatically against the fee structure, so your accounts team never has to manually match receipts.',
  },
  {
    id: 'switch-plans',
    question: 'Can we change plans later as our school grows?',
    answer:
      'Absolutely. You can upgrade at any time as your student count or feature needs grow, and your data carries over with no disruption or re-setup required.',
  },
  {
    id: 'training',
    question: 'Do you provide training for teachers and staff?',
    answer:
      'Yes — onboarding includes live training sessions for administrators and teachers, plus an in-app help center and ongoing support for any team members who join later.',
  },
  {
    id: 'trial-commitment',
    question: 'Is there a contract or long-term commitment?',
    answer:
      'No. The 14-day free trial requires no credit card, and paid plans are billed annually with no hidden lock-in beyond your chosen billing period.',
  },
]

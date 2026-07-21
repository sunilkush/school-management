import {
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineLifebuoy,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
} from 'react-icons/hi2'
import type { Benefit } from '@/types/content'

export const BENEFITS: Benefit[] = [
  {
    id: 'all-in-one',
    icon: HiOutlineSquares2X2,
    title: 'One platform, not ten tools',
    description:
      'Admissions, fees, attendance, exams, HR, and communication — all connected, so data never gets stuck in silos.',
  },
  {
    id: 'save-time',
    icon: HiOutlineBolt,
    title: 'Save hours every week',
    description:
      'Automate the repetitive admin work — fee reminders, report cards, attendance rollups — and give that time back to your staff.',
  },
  {
    id: 'insights',
    icon: HiOutlineChartBar,
    title: 'Real-time insights',
    description:
      'Live dashboards for admissions, revenue, attendance, and academics — make decisions on today’s data, not last month’s.',
  },
  {
    id: 'security',
    icon: HiOutlineShieldCheck,
    title: 'Enterprise-grade security',
    description:
      'Role-based access, encrypted data, and audit trails built in from day one — student data deserves nothing less.',
  },
  {
    id: 'scales',
    icon: HiOutlineCube,
    title: 'Scales with you',
    description:
      'Start with a single campus and grow into a multi-branch institution without switching platforms.',
  },
  {
    id: 'support',
    icon: HiOutlineLifebuoy,
    title: 'Support that actually helps',
    description:
      'Real people, fast response times, and a team that understands how schools actually run.',
  },
]

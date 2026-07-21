import {
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineDocumentCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import type { FlagshipFeature } from '@/types/content'

export const FLAGSHIP_FEATURES: FlagshipFeature[] = [
  {
    id: 'attendance',
    icon: HiOutlineCalendarDays,
    title: 'Attendance that takes seconds, not minutes',
    description:
      'Mark attendance from any device in a single tap, with biometric and geofenced options for staff. Parents get notified the moment their child is marked absent.',
    benefits: [
      'Class-wise and subject-wise attendance in one flow',
      'Instant absence alerts to parents via SMS/WhatsApp',
      'Automatic monthly attendance reports, zero manual work',
    ],
  },
  {
    id: 'fees',
    icon: HiOutlineBanknotes,
    title: 'Fee collection without the chasing',
    description:
      'Set up flexible fee structures, accept online payments, and let the system chase overdue payments automatically — so your accounts team can focus on real work.',
    benefits: [
      'Configurable fee heads, discounts, and installment plans',
      'Online payment links sent automatically before due dates',
      'Real-time collection dashboard, no spreadsheet reconciliation',
    ],
  },
  {
    id: 'exams',
    icon: HiOutlineDocumentCheck,
    title: 'Exams, grading, and report cards, connected',
    description:
      'From scheduling exams to entering marks to generating branded report cards — the entire assessment cycle lives in one place, with grading rules you control.',
    benefits: [
      'Configurable grading scales and weightage per subject',
      'Report cards generated in bulk, ready to print or share',
      'Historical performance trends for every student',
    ],
  },
  {
    id: 'timetable',
    icon: HiOutlineClock,
    title: 'Timetables that build themselves',
    description:
      'Generate conflict-free timetables across classes, sections, and teachers in minutes, then adjust with drag-and-drop when a substitution is needed.',
    benefits: [
      'Automatic clash detection across teachers and rooms',
      'One-click substitutions when a teacher is on leave',
      'Separate views for students, teachers, and admins',
    ],
  },
  {
    id: 'communication',
    icon: HiOutlineChatBubbleLeftRight,
    title: 'Every message, on the channel parents actually use',
    description:
      'Reach parents over SMS, WhatsApp, or push notification from a single composer — automated for routine updates, manual when it matters.',
    benefits: [
      'One composer, multiple channels, no duplicate work',
      'Automated reminders for fees, attendance, and events',
      'Delivery and read receipts on every message',
    ],
  },
  {
    id: 'ai-assistant',
    icon: HiOutlineSparkles,
    title: 'Ask your data questions, get real answers',
    description:
      'The AI Assistant reads your school’s live data so you can ask things like "which classes have the lowest attendance this month" and get an instant, accurate answer.',
    benefits: [
      'Plain-language queries across attendance, fees, and exams',
      'Weekly digest of the things that actually need your attention',
      'No dashboards to configure — just ask',
    ],
  },
  {
    id: 'analytics',
    icon: HiOutlineChartBar,
    title: 'Decisions backed by live numbers, not gut feel',
    description:
      'Purpose-built dashboards for admissions, revenue, attendance, and academics — so leadership always knows exactly where the institution stands.',
    benefits: [
      'Role-based dashboards for admins, principals, and trustees',
      'Drill down from a summary number to the underlying record',
      'Exportable reports for board meetings, without extra formatting',
    ],
  },
]

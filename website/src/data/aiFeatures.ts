import {
  HiOutlineBellAlert,
  HiOutlineCalendarDateRange,
  HiOutlineChartBarSquare,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentDuplicate,
  HiOutlineUserCircle,
} from 'react-icons/hi2'
import type { AIFeature } from '@/types/content'

export const AI_FEATURES: AIFeature[] = [
  {
    id: 'attendance-insights',
    icon: HiOutlineChartBarSquare,
    title: 'AI Attendance Insights',
    description: 'Automatically surfaces attendance patterns and flags students trending toward chronic absence.',
  },
  {
    id: 'student-performance',
    icon: HiOutlineUserCircle,
    title: 'AI Student Performance',
    description: 'Tracks academic trends per student and highlights who needs extra support, before report cards do.',
  },
  {
    id: 'report-generator',
    icon: HiOutlineDocumentDuplicate,
    title: 'AI Report Generator',
    description: 'Drafts progress summaries and administrative reports in seconds, ready for a quick human review.',
  },
  {
    id: 'timetable',
    icon: HiOutlineCalendarDateRange,
    title: 'AI Timetable',
    description: 'Suggests clash-free timetable arrangements as staff, rooms, and subjects change through the year.',
  },
  {
    id: 'notifications',
    icon: HiOutlineBellAlert,
    title: 'AI Notifications',
    description: 'Prioritizes the alerts that actually need attention instead of flooding every inbox equally.',
  },
  {
    id: 'exam-analysis',
    icon: HiOutlineClipboardDocumentCheck,
    title: 'AI Exam Analysis',
    description: 'Breaks down exam results by topic and class to show exactly where students are struggling.',
  },
  {
    id: 'fee-prediction',
    icon: HiOutlineCurrencyRupee,
    title: 'AI Fee Prediction',
    description: 'Forecasts collection shortfalls early, so finance teams can act before a due date, not after.',
  },
  {
    id: 'chat-assistant',
    icon: HiOutlineChatBubbleLeftEllipsis,
    title: 'AI Chat Assistant',
    description: 'A conversational assistant that answers school-data questions instantly, in plain language.',
  },
]

import { motion } from 'framer-motion'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { MiniLineChart } from '@/components/charts/MiniLineChart'
import { MiniDonutChart } from '@/components/charts/MiniDonutChart'
import { MiniBarChart } from '@/components/charts/MiniBarChart'
import { defaultViewport, fadeUp, scaleIn, staggerContainer } from '@/lib/motion'
import type { FlagshipFeatureId } from '@/types/content'

const FRAME_CLASSES =
  'shadow-soft-lg mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-black/5 bg-white'

function FeatureFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className={FRAME_CLASSES}
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={scaleIn}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 border-b border-black/5 bg-surface-soft px-4 py-3">
        <span className="bg-error/70 h-2.5 w-2.5 rounded-full" />
        <span className="bg-warning/70 h-2.5 w-2.5 rounded-full" />
        <span className="bg-success/70 h-2.5 w-2.5 rounded-full" />
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  )
}

const STUDENT_NAMES = ['Aarav Sharma', 'Diya Patel', 'Rohan Mehta', 'Ananya Gupta', 'Karan Singh']

function AttendanceMockup() {
  return (
    <motion.div
      className="flex flex-col gap-2.5"
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={staggerContainer(0.08)}
    >
      {STUDENT_NAMES.map((name, i) => (
        <motion.div
          key={name}
          variants={fadeUp}
          className="flex items-center justify-between rounded-lg border border-black/5 bg-surface-soft px-3 py-2.5"
        >
          <span className="text-dark text-sm font-medium">{name}</span>
          <span
            className={
              i === 3
                ? 'rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning'
                : 'bg-success/10 text-success rounded-full px-2.5 py-1 text-xs font-bold'
            }
          >
            {i === 3 ? 'Absent' : 'Present'}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}

function FeesMockup() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <MiniDonutChart value={78} size={80} strokeWidth={9} />
        <div>
          <p className="text-gray text-xs font-semibold">Collected this term</p>
          <p className="font-display text-dark text-xl font-bold">₹18.6L / ₹24L</p>
        </div>
      </div>
      <div className="rounded-xl border border-black/5 bg-surface-soft p-4">
        <p className="text-gray mb-3 text-xs font-semibold">Weekly Collections</p>
        <MiniBarChart data={[12, 18, 9, 22, 15, 28, 20]} height={56} />
      </div>
    </div>
  )
}

function ExamsMockup() {
  const rows = [
    { subject: 'Mathematics', grade: 'A+' },
    { subject: 'Science', grade: 'A' },
    { subject: 'English', grade: 'A+' },
    { subject: 'Social Studies', grade: 'B+' },
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-black/5">
      <div className="bg-primary-50 text-primary flex justify-between px-4 py-2.5 text-xs font-bold">
        <span>Subject</span>
        <span>Grade</span>
      </div>
      {rows.map((row) => (
        <div key={row.subject} className="text-dark flex justify-between border-t border-black/5 px-4 py-2.5 text-sm">
          <span>{row.subject}</span>
          <span className="font-bold">{row.grade}</span>
        </div>
      ))}
    </div>
  )
}

function TimetableMockup() {
  const slots = ['Math', 'Science', 'Break', 'English', 'History', 'Free']
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot, i) => (
        <div
          key={slot + i}
          className={
            slot === 'Break' || slot === 'Free'
              ? 'text-gray rounded-lg border border-dashed border-black/10 px-3 py-4 text-center text-xs font-medium'
              : 'bg-primary-50 text-primary rounded-lg px-3 py-4 text-center text-xs font-bold'
          }
        >
          {slot}
        </div>
      ))}
    </div>
  )
}

function CommunicationMockup() {
  const messages = [
    { from: 'School', text: 'Fee due reminder sent to 42 parents.', mine: false },
    { from: 'You', text: 'Send a note about tomorrow’s PTM.', mine: true },
    { from: 'School', text: 'PTM reminder scheduled for 6 PM.', mine: false },
  ]
  return (
    <div className="flex flex-col gap-2.5">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
          <div
            className={
              m.mine
                ? 'bg-primary max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white'
                : 'text-dark max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-soft px-4 py-2.5 text-sm'
            }
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function AIAssistantMockup() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5">
        <span className="bg-primary-50 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <HiOutlineSparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="text-dark rounded-2xl rounded-tl-sm bg-surface-soft px-4 py-3 text-sm">
          Which sections have attendance below 85% this month?
        </div>
      </div>
      <div className="ml-10 rounded-2xl rounded-tl-sm border border-black/5 bg-white px-4 py-3 text-sm">
        <p className="text-dark mb-2">
          <strong>Class 8-B</strong> and <strong>Class 10-A</strong> are below 85% this month.
        </p>
        <div className="flex gap-2">
          <span className="bg-warning/10 text-warning rounded-full px-2.5 py-1 text-xs font-bold">8-B · 81%</span>
          <span className="bg-warning/10 text-warning rounded-full px-2.5 py-1 text-xs font-bold">10-A · 83%</span>
        </div>
      </div>
    </div>
  )
}

function AnalyticsMockup() {
  return (
    <div className="flex flex-col gap-4">
      <MiniLineChart data={[40, 52, 48, 61, 58, 70, 76]} width={320} height={72} className="w-full" />
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Admissions', value: '312' },
          { label: 'Revenue', value: '₹42L' },
          { label: 'Retention', value: '96%' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-black/5 bg-surface-soft p-3 text-center">
            <p className="font-display text-dark text-sm font-bold">{stat.value}</p>
            <p className="text-gray text-[10px]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const MOCKUPS: Record<FlagshipFeatureId, () => React.ReactElement> = {
  attendance: AttendanceMockup,
  fees: FeesMockup,
  exams: ExamsMockup,
  timetable: TimetableMockup,
  communication: CommunicationMockup,
  'ai-assistant': AIAssistantMockup,
  analytics: AnalyticsMockup,
}

/** Hand-built, per-feature illustrative visual — never a real product screenshot. */
export function IllustrativeMockup({ featureId }: { featureId: FlagshipFeatureId }) {
  const Body = MOCKUPS[featureId]
  return (
    <FeatureFrame>
      <Body />
    </FeatureFrame>
  )
}

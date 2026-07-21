import { motion } from 'framer-motion'
import {
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineUserGroup,
  HiOutlineUserPlus,
} from 'react-icons/hi2'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { MiniLineChart } from '@/components/charts/MiniLineChart'
import { MiniDonutChart } from '@/components/charts/MiniDonutChart'
import { ActivityList } from '@/components/charts/ActivityList'
import { NotificationStack } from '@/components/charts/NotificationStack'
import { defaultViewport, scaleIn } from '@/lib/motion'

const STAT_CARDS = [
  { id: 'students', icon: HiOutlineUserGroup, label: 'Total Students', value: '1,284', color: 'var(--color-primary)' },
  { id: 'fees', icon: HiOutlineBanknotes, label: 'Fees Collected Today', value: '₹2.4L', color: '#22C55E' },
  { id: 'attendance', icon: HiOutlineCheckCircle, label: 'Attendance Today', value: '94%', color: '#2563EB' },
  { id: 'admissions', icon: HiOutlineUserPlus, label: 'Pending Admissions', value: '18', color: '#F59E0B' },
]

const ACTIVITY_ITEMS = [
  { id: '1', icon: HiOutlineUserPlus, text: 'New admission: Aditi Rao — Class 6', time: '5 minutes ago', color: 'var(--color-primary)' },
  { id: '2', icon: HiOutlineBanknotes, text: 'Fee payment received from Rohan Mehta', time: '18 minutes ago', color: '#22C55E' },
  { id: '3', icon: HiOutlineCalendarDays, text: 'PTM scheduled for Class 8-B, Friday', time: '1 hour ago', color: '#2563EB' },
  { id: '4', icon: HiOutlineExclamationTriangle, text: 'Low attendance flagged for Class 10-A', time: '2 hours ago', color: '#F59E0B' },
]

const NOTIFICATION_ITEMS = [
  { id: '1', icon: HiOutlineAcademicCap, title: 'Exam results published', subtitle: 'Class 9 — Mid-term results are live', color: 'var(--color-primary)' },
  { id: '2', icon: HiOutlineBanknotes, title: 'Fee reminder sent', subtitle: '42 parents notified automatically', color: '#22C55E' },
]

export function DashboardPreview() {
  return (
    <section id="dashboard" className="bg-dark py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Command Center"
          tone="dark"
          title="Everything about today, on one screen"
          description="A single dashboard for attendance, revenue, fees, admissions, and the notifications that actually matter."
        />

        <motion.div
          className="shadow-soft-lg mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white"
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={scaleIn}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between border-b border-black/5 bg-surface-soft px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="bg-error/70 h-2.5 w-2.5 rounded-full" />
              <span className="bg-warning/70 h-2.5 w-2.5 rounded-full" />
              <span className="bg-success/70 h-2.5 w-2.5 rounded-full" />
              <span className="text-gray ml-3 text-xs font-medium">app.codevariant.example/overview</span>
            </div>
            <span className="text-gray hidden text-xs font-medium sm:block">Friday, 12 June</span>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {STAT_CARDS.map((stat) => (
                  <div key={stat.id} className="rounded-xl border border-black/5 bg-surface-soft p-4">
                    <span
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${stat.color} 14%, transparent)`, color: stat.color }}
                    >
                      <stat.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <p className="font-display text-dark text-lg font-bold">{stat.value}</p>
                    <p className="text-gray text-[11px] leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                <div className="rounded-xl border border-black/5 bg-surface-soft p-5">
                  <p className="text-gray mb-3 text-xs font-semibold">Revenue — Last 7 Weeks</p>
                  <MiniLineChart data={[38, 45, 41, 56, 52, 66, 74]} width={280} height={80} className="w-full" />
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-black/5 bg-surface-soft p-5">
                  <p className="text-gray mb-3 self-start text-xs font-semibold">Attendance</p>
                  <MiniDonutChart value={94} size={84} strokeWidth={9} />
                </div>
              </div>

              <div className="rounded-xl border border-black/5 bg-surface-soft p-5">
                <p className="text-gray mb-3 text-xs font-semibold">Recent Activity</p>
                <ActivityList items={ACTIVITY_ITEMS} />
              </div>
            </div>

            <div className="rounded-xl border border-black/5 bg-surface-soft p-5">
              <p className="text-gray mb-3 text-xs font-semibold">Notifications</p>
              <NotificationStack items={NOTIFICATION_ITEMS} />
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

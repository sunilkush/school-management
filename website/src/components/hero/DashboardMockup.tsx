import { motion } from 'framer-motion'
import { HiOutlineAcademicCap, HiOutlineBell, HiOutlineUserGroup } from 'react-icons/hi2'
import { MiniLineChart } from '@/components/charts/MiniLineChart'
import { MiniDonutChart } from '@/components/charts/MiniDonutChart'
import { MiniBarChart } from '@/components/charts/MiniBarChart'
import { defaultViewport, scaleIn } from '@/lib/motion'

const REVENUE_TREND = [32, 41, 38, 52, 49, 63, 71]
const ADMISSIONS_BY_WEEK = [12, 18, 14, 24, 20, 30, 26, 34]

/**
 * Illustrative dashboard "app window" mockup for the Hero — hand-built from
 * the shared chart primitives, not a real product screenshot.
 */
export function DashboardMockup() {
  return (
    <motion.div
      className="shadow-soft-lg mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-black/5 bg-white"
      initial="hidden"
      whileInView="show"
      viewport={defaultViewport}
      variants={scaleIn}
      aria-hidden="true"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-black/5 bg-surface-soft px-4 py-3">
        <span className="bg-error/70 h-2.5 w-2.5 rounded-full" />
        <span className="bg-warning/70 h-2.5 w-2.5 rounded-full" />
        <span className="bg-success/70 h-2.5 w-2.5 rounded-full" />
        <span className="text-gray ml-3 text-xs font-medium">app.codevariant.example/dashboard</span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-dark text-base font-bold">Good morning, Principal</p>
            <p className="text-gray text-xs">Here&apos;s what&apos;s happening today</p>
          </div>
          <span className="bg-primary-50 text-primary flex h-9 w-9 items-center justify-center rounded-full">
            <HiOutlineBell className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-black/5 bg-surface-soft p-4">
            <p className="text-gray text-xs font-semibold">Revenue Trend</p>
            <MiniLineChart data={REVENUE_TREND} width={220} height={64} className="mt-2 w-full" />
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-black/5 bg-surface-soft p-4">
            <p className="text-gray mb-2 self-start text-xs font-semibold">Attendance</p>
            <MiniDonutChart value={94} size={72} strokeWidth={8} />
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-surface-soft p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-gray text-xs font-semibold">New Admissions — This Week</p>
            <span className="text-primary text-xs font-bold">+18%</span>
          </div>
          <MiniBarChart data={ADMISSIONS_BY_WEEK} height={56} activeIndex={ADMISSIONS_BY_WEEK.length - 2} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <HiOutlineUserGroup className="text-primary h-5 w-5" aria-hidden="true" />
            <span className="text-dark text-sm font-semibold">1,284 students</span>
          </div>
          <div className="flex items-center gap-2.5">
            <HiOutlineAcademicCap className="text-primary h-5 w-5" aria-hidden="true" />
            <span className="text-dark text-sm font-semibold">86 staff</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

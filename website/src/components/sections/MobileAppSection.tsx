import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineBanknotes,
  HiOutlineBellAlert,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
  HiOutlineDevicePhoneMobile,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { FaApple, FaGooglePlay } from 'react-icons/fa6'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { PhoneMockup } from '@/components/mobile/PhoneMockup'
import { MiniDonutChart } from '@/components/charts/MiniDonutChart'
import { defaultViewport, fadeUp, scaleIn } from '@/lib/motion'
import { cn } from '@/lib/utils'

type AppTab = 'parent' | 'teacher' | 'student' | 'admin'

const TABS: { id: AppTab; label: string }[] = [
  { id: 'parent', label: 'Parent App' },
  { id: 'teacher', label: 'Teacher App' },
  { id: 'student', label: 'Student App' },
  { id: 'admin', label: 'Admin App' },
]

function ScreenHeader({ title }: { title: string }) {
  return (
    <div className="bg-primary flex items-center justify-between px-4 pt-8 pb-4">
      <span className="text-sm font-bold text-white">{title}</span>
      <HiOutlineBellAlert className="h-4.5 w-4.5 text-white/80" aria-hidden="true" />
    </div>
  )
}

function ParentScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Hi, Mr. Sharma" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="bg-surface-soft rounded-xl border border-black/5 p-3">
          <p className="text-gray text-[10px] font-semibold">Aarav — Class 6B</p>
          <div className="mt-2 flex items-center gap-3">
            <MiniDonutChart value={96} size={48} strokeWidth={6} />
            <div>
              <p className="text-dark text-xs font-bold">Attendance</p>
              <p className="text-gray text-[10px]">This month</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-black/5 p-3">
          <HiOutlineBanknotes className="text-success h-4 w-4" aria-hidden="true" />
          <p className="text-dark text-xs font-semibold">Fees paid for this term</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-black/5 p-3">
          <HiOutlineCalendarDays className="text-primary h-4 w-4" aria-hidden="true" />
          <p className="text-dark text-xs font-semibold">PTM on Friday, 6 PM</p>
        </div>
      </div>
    </div>
  )
}

function TeacherScreen() {
  const students = ['Aarav Sharma', 'Diya Patel', 'Rohan Mehta']
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Class 6B — Attendance" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {students.map((name) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-black/5 px-3 py-2">
            <span className="text-dark text-xs font-medium">{name}</span>
            <HiOutlineCheckCircle className="text-success h-4 w-4" aria-hidden="true" />
          </div>
        ))}
        <button
          type="button"
          className="bg-primary mt-2 rounded-lg py-2 text-xs font-bold text-white"
          tabIndex={-1}
        >
          Submit Attendance
        </button>
      </div>
    </div>
  )
}

function StudentScreen() {
  const tasks = ['Math — Chapter 4 Exercises', 'Science — Lab Report', 'English — Essay Draft']
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Today's Homework" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {tasks.map((task) => (
          <div key={task} className="flex items-start gap-2 rounded-lg border border-black/5 p-3">
            <HiOutlineBookOpen className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-dark text-xs leading-snug font-medium">{task}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Overview" />
      <div className="grid grid-cols-2 gap-2 p-4">
        {[
          { icon: HiOutlineUserGroup, label: 'Students', value: '1,284' },
          { icon: HiOutlineChartBar, label: 'Revenue', value: '₹42L' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-black/5 p-3">
            <stat.icon className="text-primary mb-1.5 h-4 w-4" aria-hidden="true" />
            <p className="text-dark text-xs font-bold">{stat.value}</p>
            <p className="text-gray text-[10px]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREENS: Record<AppTab, () => React.ReactElement> = {
  parent: ParentScreen,
  teacher: TeacherScreen,
  student: StudentScreen,
  admin: AdminScreen,
}

export function MobileAppSection() {
  const [activeTab, setActiveTab] = useState<AppTab>('parent')
  const Screen = SCREENS[activeTab]

  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={defaultViewport}
          variants={scaleIn}
          className="order-2 flex justify-center lg:order-1"
        >
          <PhoneMockup key={activeTab}>
            <Screen />
          </PhoneMockup>
        </motion.div>

        <div className="order-1 flex flex-col items-start gap-6 lg:order-2">
          <SectionHeading
            eyebrow="On Every Device"
            align="left"
            title="One app for every role in your school"
            description="Parents, teachers, students, and administrators each get an app built around what they actually need to do."
          />

          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  activeTab === tab.id ? 'bg-primary text-white' : 'text-gray bg-black/5 hover:bg-black/10',
                )}
              >
                <HiOutlineDevicePhoneMobile className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            className="flex items-center gap-3"
            initial="hidden"
            whileInView="show"
            viewport={defaultViewport}
            variants={fadeUp}
          >
            <span className="text-dark flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">
              <FaApple className="h-4 w-4" aria-hidden="true" /> iOS
            </span>
            <span className="text-dark flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">
              <FaGooglePlay className="h-4 w-4" aria-hidden="true" /> Android
            </span>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

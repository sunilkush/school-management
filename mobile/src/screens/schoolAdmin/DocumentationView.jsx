import React from 'react';
import { View } from 'react-native';
import { List, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';

// Condensed port of the School Admin section of frontend/src/pages/Documentation/RoleDocumentation.jsx
// (SCHOOL_ADMIN_DOCS) — that page is purely static reference content with no API calls, so this is
// a direct content port, not a new backend-backed feature. The web page keys this content per role
// (ROLE_DOCS); School Admin/Principal/Vice Principal all share SCHOOL_ADMIN_DOCS there, so this
// screen does the same rather than showing School-Admin-flavored content to every other role that
// also has a 'Documentation' nav entry (e.g. Super Admin) — those get an honest "not ported yet"
// state instead of mislabeled content.
const SCHOOL_ADMIN_LIKE_ROLES = new Set(['School Admin', 'Principal', 'Vice Principal']);

const SECTIONS = [
  {
    id: 'overview',
    title: 'Dashboard Overview',
    subtitle: 'Your school management control centre',
    overview:
      'Your dashboard gives you a real-time summary of your school — active students, staff, attendance today, upcoming exams, fee collection status, and quick-action buttons.',
    list: [
      'Users — teachers, students, parents, accountants, and support staff.',
      'Academic structure — classes, sections, subjects, timetables.',
      'Attendance — daily student & staff attendance with reports.',
      'Exams & Results — schedule exams, enter marks, generate report cards.',
      'Fees — structure, collection, receipts, defaulter tracking.',
      'Payroll — salary structures, monthly runs, payslips.',
      'Communication — send SMS/email notifications to parents and staff.',
      'Events & Calendar — school events, holidays, term dates.',
      'Reports — attendance, finance, academic performance.',
    ],
    tips: [
      'Pin frequently visited pages to your browser bookmarks for faster access.',
      'Check the dashboard daily for attendance alerts and fee overdue notifications.',
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    subtitle: 'Add and manage all school staff and students',
    overview:
      'Manage all users in your school from one place. You can register new teachers, students, parents, and support staff, and activate or deactivate accounts.',
    steps: [
      'Go to User Management → Teachers and click Register Teacher.',
      'Fill in name, email, phone, and subject specialisations.',
      'The teacher receives login credentials via email.',
      'Assign the teacher to a class/subject from Academic → Class Teacher Assignments.',
    ],
    tips: [
      'Deactivating a user blocks login immediately without deleting records.',
      'Use bulk import (CSV) for enrolling large batches of students at term start.',
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance Management',
    subtitle: 'Monitor daily attendance across the school',
    overview:
      'View and manage student and staff attendance. You can see attendance across all classes, correct submitted records, and generate compliance reports.',
    list: [
      'Monthly Report — per-student attendance % for the month.',
      'Analytics — heatmap and trend charts by class.',
      'Low Attendance List — students below the threshold defined in Settings.',
      'Staff Attendance — teacher and support staff punch-in/out summary.',
    ],
    tips: ['Monthly reports are auto-archived at month end for record keeping.'],
  },
  {
    id: 'exams',
    title: 'Exams & Results',
    subtitle: 'Schedule exams, enter marks, issue report cards',
    overview:
      'The exam module lets you create exam schedules, assign subjects and invigilators, collect marks from teachers, and generate rank lists and report cards.',
    steps: [
      'Go to Exams → Exam Schedule → Create Exam.',
      'Enter exam name, type (unit test, mid-term, final), and date range.',
      'Add subjects with max marks and pass marks for each.',
      'Publish the timetable — teachers and students can now view it.',
      'Once all teachers have entered marks, go to Exams → Results to generate the rank list.',
    ],
    tips: ['Exam Coordinator role can manage exams independently if set up.'],
  },
  {
    id: 'fees',
    title: 'Fee Management',
    subtitle: 'Structure, collect, and track school fees',
    overview:
      'Configure fee structures per class, track collections, generate receipts, and monitor defaulters. Accountants handle day-to-day collection; you set the structures.',
    list: [
      'Fee Structure — add fee heads with amounts, assign to classes.',
      'Fee Collection — see pending vs. collected per student.',
      'Defaulters Report — students with overdue fees highlighted.',
      'Receipt Ledger — every payment recorded with a receipt number.',
    ],
    tips: ['Partial payments are supported — remaining balance auto-carries forward.'],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    subtitle: 'School performance at a glance',
    overview:
      'Access comprehensive reports on attendance trends, exam performance, fee collection, and staff metrics.',
    list: [
      'Attendance Summary — daily, monthly, per-class and per-student.',
      'Academic Performance — class averages, subject-wise scores, rank distribution.',
      'Fee Collection Report — collected vs. pending, category breakdown.',
      'Staff Summary — attendance, leave balance, payroll cost.',
    ],
    tips: ['All date-range reports default to the active academic year.'],
  },
];

function Bullets({ items, color }) {
  const { typography, spacing } = useAppTheme();
  return (
    <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: 4 }}>
      {items.map((item, i) => (
        <Text key={i} style={[typography.body, { color }]}>
          {'•'} {item}
        </Text>
      ))}
    </View>
  );
}

export function DocumentationView() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  if (!SCHOOL_ADMIN_LIKE_ROLES.has(role?.name)) {
    return (
      <ScreenContainer scrollable>
        <QueryState
          isLoading={false}
          isError={false}
          isEmpty
          emptyIcon="file-document-outline"
          emptyLabel="Documentation for your role isn't available yet"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
        Quick-reference guide for the School Admin role.
      </Text>

      <List.AccordionGroup>
        {SECTIONS.map((section) => (
          <List.Accordion
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.subtitle}
            left={(props) => <List.Icon {...props} icon="book-open-variant" />}
            style={{ backgroundColor: colors.surface, marginBottom: spacing.sm, borderRadius: 12 }}
          >
            <Text style={[typography.body, { color: colors.textSecondary, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
              {section.overview}
            </Text>
            {section.steps && <Bullets items={section.steps} color={colors.text} />}
            {section.list && <Bullets items={section.list} color={colors.text} />}
            {section.tips && (
              <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>TIPS</Text>
                <Bullets items={section.tips} color={colors.textMuted} />
              </View>
            )}
          </List.Accordion>
        ))}
      </List.AccordionGroup>
    </ScreenContainer>
  );
}

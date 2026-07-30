import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { Panel } from '../components/ui/Panel';
import { DonutChart } from '../components/charts/DonutChart';
import { VerticalBarChart } from '../components/charts/VerticalBarChart';
import { STAT_COLORS } from '../theme/patterns';
import { roleColor } from '../utils/roleColors';
import { SuperAdminReportsView } from './superAdmin/SuperAdminReportsView';
import { AcademicReportsScreen } from './AcademicReportsScreen';
import { CounselorReportsView } from './counselor/CounselorReportsView';
import { TeacherReportsView } from './teacher/TeacherReportsView';
import { LibraryReportsView } from './librarian/LibraryReportsView';
import { HostelWardenDashboard } from './HostelScreen';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetSchoolReportQuery } from '../store/api/apiSlice';

const GENDER_COLORS = { male: '#2563EB', female: '#EC4899', other: '#F59E0B' };

// Super Admin's web Reports page is a completely different feature (a custom report builder with
// its own CRUD/export surface, frontend/src/pages/Super_Admin/Reports_&_Analytics/Reports.jsx) —
// not this school-overview report, which School Admin/Principal/Vice Principal share verbatim.
const OVERVIEW_REPORT_ROLES = new Set(['School Admin', 'Principal', 'Vice Principal']);

function SuperAdminReports() {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Saved report builder
          </Text>
        </View>
      </View>
      <SuperAdminReportsView />
    </ScreenContainer>
  );
}

function CounselorReports() {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Counseling activity overview
          </Text>
        </View>
      </View>
      <CounselorReportsView />
    </ScreenContainer>
  );
}

function TeacherReports() {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            View and track all your generated reports
          </Text>
        </View>
      </View>
      <TeacherReportsView />
    </ScreenContainer>
  );
}

function ChartTitle({ title }) {
  const { colors, typography, spacing } = useAppTheme();
  return <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>{title}</Text>;
}

/** School overview report — a single GET shared verbatim by School Admin/Principal/Vice Principal
 * on the web app (frontend/src/pages/School_Admin/Reports/schoolAdminReport.jsx and
 * Vice_Principal/VicePrincipalReports.jsx). Note: the web VP page has a live bug reading
 * `genderStats` as an object when the API actually returns an array of {_id, count} — this screen
 * is built against the real array shape, not that bug. */
function SchoolOverviewReport() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSchoolReportQuery(
    { schoolId, academicYearId },
    { skip: !schoolId || !academicYearId }
  );

  const roleWiseData = useMemo(
    () => (data?.roleWise ?? []).map((r, i) => ({ label: r._id ?? 'Unknown', value: r.count, color: roleColor(r._id, null) ?? STAT_COLORS[i % STAT_COLORS.length] })),
    [data]
  );
  const genderData = useMemo(
    () => (data?.genderStats ?? []).map((g) => ({ label: g._id ?? 'Unknown', value: g.count, color: GENDER_COLORS[g._id?.toLowerCase()] ?? '#94A3B8' })),
    [data]
  );
  const classWiseData = useMemo(() => (data?.classWise ?? []).map((c) => ({ label: c._id ?? '—', value: c.count })), [data]);
  const sectionWiseData = useMemo(() => (data?.sectionWise ?? []).map((s) => ({ label: s._id ?? '—', value: s.count })), [data]);

  const stats = [
    { key: 'students', label: 'Students', icon: 'school-outline', color: '#0EA472', value: data?.summary?.studentCount ?? 0 },
    { key: 'teachers', label: 'Teachers', icon: 'account-tie-outline', color: '#14B8A6', value: data?.summary?.teacherCount ?? 0 },
    { key: 'parents', label: 'Parents', icon: 'account-child-outline', color: '#7C3AED', value: data?.summary?.parentCount ?? 0 },
    { key: 'admins', label: 'Admins', icon: 'shield-account-outline', color: '#2563EB', value: data?.summary?.adminCount ?? 0 },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {data?.academicYear ?? user?.academicYear?.name ?? 'Current'} Academic Year overview
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!data}
        emptyIcon="chart-box-outline"
        emptyLabel="No report data available yet"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            {stats.map((s) => (
              <StatCard key={s.key} label={s.label} metric={s} />
            ))}
          </StatGrid>
        </View>

        <Panel>
          <ChartTitle title="Role Distribution" />
          <DonutChart data={roleWiseData} centerLabel="Users" />
        </Panel>

        <Panel>
          <ChartTitle title="Gender Distribution" />
          <DonutChart data={genderData} centerLabel="Students" />
        </Panel>

        <Panel>
          <ChartTitle title="Class-wise Enrollment" />
          <VerticalBarChart data={classWiseData} color={colors.primary} />
        </Panel>

        <Panel style={{ marginBottom: 0 }}>
          <ChartTitle title="Section-wise Enrollment" />
          <VerticalBarChart data={sectionWiseData} color="#14B8A6" />
        </Panel>
      </QueryState>
    </ScreenContainer>
  );
}

export function ReportsScreen() {
  const { role } = useAuth();

  if (OVERVIEW_REPORT_ROLES.has(role?.name)) {
    return <SchoolOverviewReport />;
  }
  if (role?.name === 'Super Admin') {
    return <SuperAdminReports />;
  }
  // Subject Coordinator's web "Reports" page (ExamReport.jsx) is the same per-attempt exam-report
  // row-list Principal's "Academic Reports" already covers — not the school-overview report above.
  if (role?.name === 'Subject Coordinator') {
    return <AcademicReportsScreen />;
  }
  if (role?.name === 'Counselor') {
    return <CounselorReports />;
  }
  if (role?.name === 'Teacher') {
    return <TeacherReports />;
  }
  // Librarian and Hostel Warden both reference this same 'Reports' key in their own NAV_CONFIG
  // but had no branch here at all — the SCREEN_MAP entry existed, so the tab opened, but every
  // tap landed on the generic "not available" placeholder below regardless.
  if (role?.name === 'Librarian') {
    return <LibraryReportsView />;
  }
  if (role?.name === 'Hostel Warden') {
    return <HostelWardenDashboard />;
  }

  return (
    <ScreenContainer>
      <QueryState
        isLoading={false}
        isError={false}
        isEmpty
        emptyIcon="chart-box-outline"
        emptyLabel="Reports view isn't available for this role yet"
      />
    </ScreenContainer>
  );
}

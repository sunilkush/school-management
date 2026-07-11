import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Card, List, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { CategoryBarChart } from '../components/charts/CategoryBarChart';
import { SchoolAdminDashboard } from './dashboard/SchoolAdminDashboard';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatCurrency } from '../utils/format';
import {
  useGetDashboardRoleOverviewQuery,
  useGetDashboardSummaryQuery,
  useGetSchoolAdminAnalyticsQuery,
} from '../store/api/apiSlice';

// Only these 2 roles can call GET /dashboard/school-admin/analytics (role middleware) and still
// use the generic flat-stat rendering below — School Admin itself now has a bespoke, web-parity
// dashboard (SchoolAdminDashboard) instead, see the `role?.name === 'School Admin'` branch below.
const ANALYTICS_ROLES = new Set(['Principal', 'Vice Principal']);

// These 3 roles have a real branch in the backend's GET /dashboard/summary controller — Accountant
// was previously allowed through that route's middleware but had no branch (silently landed on
// "Dashboard not available for this role"), fixed backend-side to compute real figures. Every
// other role still uses the universal /dashboard/role-overview and its generic fallback branch.
const SUMMARY_ROLES = new Set(['Super Admin', 'Teacher', 'Accountant']);

const SUMMARY_META = {
  'Super Admin': [
    { key: 'schools', label: 'Schools', icon: 'domain' },
    { key: 'admins', label: 'Admins', icon: 'account-tie' },
    { key: 'users', label: 'Users', icon: 'account-group' },
    { key: 'feesCollected', label: 'Fees Collected', format: 'currency', icon: 'cash-multiple' },
  ],
  Teacher: [
    { key: 'students', label: 'Students', icon: 'school-outline' },
    { key: 'attendanceMarked', label: 'Attendance Marked Today', icon: 'clipboard-check-outline' },
  ],
  Accountant: [
    { key: 'monthCollection', label: 'This Month Collection', format: 'currency', icon: 'cash-multiple' },
    { key: 'pendingDues', label: 'Pending Dues', format: 'currency', icon: 'alert-circle-outline' },
    { key: 'successfulTransactions', label: 'Successful Transactions', icon: 'check-circle-outline' },
  ],
};

function SummaryDashboard({ roleName }) {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetDashboardSummaryQuery();
  const metaList = SUMMARY_META[roleName] ?? [];
  const metrics = metaList.map((m) => ({ ...m, value: data?.[m.key] }));

  return (
    <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
      <StatGrid>
        {metrics.map((m) => (
          <StatCard key={m.key} label={m.label} metric={m} />
        ))}
      </StatGrid>
    </QueryState>
  );
}

function RoleOverviewDashboard() {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetDashboardRoleOverviewQuery();
  const { colors, typography, spacing } = useAppTheme();
  const upcomingExams = data?.lists?.upcomingExams ?? [];

  return (
    <QueryState
      isLoading={isLoading || isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!data?.metrics?.length}
      emptyIcon="view-dashboard-outline"
      emptyLabel="No dashboard data available yet"
    >
      <StatGrid>
        {(data?.metrics ?? []).map((m) => (
          <StatCard key={m.key} label={m.label} metric={m} />
        ))}
      </StatGrid>

      {upcomingExams.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.xs }]}>Upcoming Exams</Text>
          {upcomingExams.map((exam, index) => (
            <List.Item
              key={`${exam.title}-${index}`}
              title={exam.title}
              description={exam.date}
              left={(props) => <List.Icon {...props} icon="pencil-box-outline" />}
            />
          ))}
        </View>
      )}
    </QueryState>
  );
}

function IncomeAnalysisCard() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSchoolAdminAnalyticsQuery();
  const items = data?.incomeAnalysis ?? [];

  return (
    <Card style={{ marginTop: spacing.xl, backgroundColor: colors.surface }}>
      <Card.Content style={{ padding: spacing.lg }}>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Income Analysis</Text>
        <QueryState
          isLoading={isLoading || isFetching}
          isError={isError}
          error={error}
          onRetry={refetch}
          isEmpty={items.length === 0}
          emptyIcon="chart-bar"
          emptyLabel="No income data yet this year"
        >
          <CategoryBarChart data={items} valueFormatter={formatCurrency} />
        </QueryState>
      </Card.Content>
    </Card>
  );
}

export function DashboardScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { user, role } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? '';
  const showSummary = useMemo(() => SUMMARY_ROLES.has(role?.name), [role?.name]);

  // School Admin gets a bespoke dashboard matching the web app's SchoolAdminDashboard.jsx exactly
  // (sectioned Key Metrics / Finance Overview / Human Resources panels), not the generic layout
  // below — it owns its own page header, so it renders standalone.
  if (role?.name === 'School Admin') {
    return (
      <ScreenContainer scrollable>
        <SchoolAdminDashboard />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{role?.name?.toUpperCase()}</Text>
        <Text style={[typography.h1, { color: colors.text }]}>Hi, {firstName}</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {user?.school?.name || 'No school assigned'}
        </Text>
      </View>

      {showSummary ? <SummaryDashboard roleName={role?.name} /> : <RoleOverviewDashboard />}
      {ANALYTICS_ROLES.has(role?.name) && <IncomeAnalysisCard />}
    </ScreenContainer>
  );
}

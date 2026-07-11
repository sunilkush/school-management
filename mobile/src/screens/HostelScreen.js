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
import { formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetHostelWardenDashboardQuery } from '../store/api/apiSlice';

function ChartTitle({ title }) {
  const { colors, typography, spacing } = useAppTheme();
  return <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>{title}</Text>;
}

/** Mirrors frontend/src/pages/HostelWarden/HostelDashboard.jsx — on web this is that role's whole
 * landing page; here it's the content of the "Hostel" tab (mobile has a separate generic Dashboard
 * tab already). Leaves/Visitors/Complaints full management (5 sub-features on web) are out of
 * scope — this is the read-only KPI+chart overview only. */
export function HostelScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetHostelWardenDashboardQuery();
  const kpis = data?.kpis;

  const complaintData = useMemo(
    () => (data?.complaintByType ?? []).map((c, i) => ({ label: c._id ?? 'Other', value: c.count, color: STAT_COLORS[i % STAT_COLORS.length] })),
    [data]
  );
  const leaveData = useMemo(() => (data?.leaveMonthly ?? []).map((m) => ({ label: m._id, value: m.count })), [data]);

  const stats = kpis
    ? [
        { key: 'rooms', label: 'Total Rooms', icon: 'door', color: colors.primary, value: kpis.totalRooms },
        { key: 'occupancy', label: 'Occupancy Rate', icon: 'bed', color: '#14B8A6', suffix: '%', value: kpis.occupancyRate },
        { key: 'vacant', label: 'Vacant Beds', icon: 'bed-empty', color: '#22C55E', value: kpis.vacantBeds },
        { key: 'students', label: 'Total Students', icon: 'account-group-outline', color: '#2563EB', value: kpis.totalStudents },
        { key: 'pendingLeaves', label: 'Pending Leaves', icon: 'calendar-clock-outline', color: '#F59E0B', value: kpis.pendingLeaves },
        { key: 'visitors', label: 'Visitors Today', icon: 'account-multiple-outline', color: '#7C3AED', value: kpis.visitorsToday },
        { key: 'complaints', label: 'Open Complaints', icon: 'alert-circle-outline', color: '#EF4444', value: kpis.openComplaints },
        { key: 'urgent', label: 'Urgent Complaints', icon: 'alert-outline', color: '#DC2626', value: kpis.urgentComplaints },
      ]
    : [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="home-city-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Hostel</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Occupancy, leaves and complaints overview
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!kpis}
        emptyIcon="home-city-outline"
        emptyLabel="No hostel data available yet"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            {stats.map((s) => (
              <StatCard key={s.key} label={s.label} metric={s} />
            ))}
          </StatGrid>
        </View>

        {data?.lastAttendance && (
          <Panel>
            <ChartTitle title="Last Attendance" />
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {formatDate(data.lastAttendance.date)} · {data.lastAttendance.session}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
              <Text style={[typography.caption, { color: '#22C55E' }]}>Present: {data.lastAttendance.totalPresent}</Text>
              <Text style={[typography.caption, { color: '#EF4444' }]}>Absent: {data.lastAttendance.totalAbsent}</Text>
              <Text style={[typography.caption, { color: '#F59E0B' }]}>On Leave: {data.lastAttendance.totalOnLeave}</Text>
            </View>
          </Panel>
        )}

        {leaveData.length > 0 && (
          <Panel>
            <ChartTitle title="Leave Requests (Last 6 Months)" />
            <VerticalBarChart data={leaveData} color={colors.primary} />
          </Panel>
        )}

        {complaintData.length > 0 && (
          <Panel style={{ marginBottom: 0 }}>
            <ChartTitle title="Open Complaints by Type" />
            <DonutChart data={complaintData} centerLabel="Complaints" />
          </Panel>
        )}
      </QueryState>
    </ScreenContainer>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Panel } from '../../components/ui/Panel';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetCounselingSessionsQuery, useGetCounselingSessionStatsQuery } from '../../store/api/apiSlice';

/** Mirrors frontend's CounselorReports (pages/Counselor/CounselorPages.jsx) — two read-only
 * aggregation displays over /counseling-sessions/stats, no export or custom report builder (the
 * web page doesn't have one either). "Total Sessions" combines both Sessions and Appointments,
 * matching the web page's own unfiltered session count. */
export function CounselorReportsView() {
  const { colors, typography, spacing } = useAppTheme();

  // "Total Sessions" below reads sessions.length (a page, not the true total) — needs a limit
  // high enough that the page effectively IS the whole dataset for realistic school sizes,
  // otherwise the reported total silently undercounts past the backend's default limit=50.
  const sessionsQuery = useGetCounselingSessionsQuery({ limit: 500 });
  const totalSessions = sessionsQuery.data?.sessions?.length ?? sessionsQuery.data?.total ?? 0;

  const statsQuery = useGetCounselingSessionStatsQuery();
  const byStatus = statsQuery.data?.byStatus ?? {};
  const topIssues = statsQuery.data?.topIssues ?? [];
  const maxCount = Math.max(1, ...topIssues.map((i) => i.count));

  return (
    <View>
      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total Sessions" metric={{ label: 'Total Sessions', icon: 'calendar-multiple', color: colors.primary, value: totalSessions }} />
          <StatCard label="Completed" metric={{ label: 'Completed', icon: 'check-circle-outline', color: '#22C55E', value: byStatus.Completed ?? 0 }} />
          <StatCard label="Scheduled" metric={{ label: 'Scheduled', icon: 'calendar-clock-outline', color: '#2563EB', value: byStatus.Scheduled ?? 0 }} />
          <StatCard label="Cancelled / No Show" metric={{ label: 'Cancelled / No Show', icon: 'close-circle-outline', color: '#EF4444', value: (byStatus.Cancelled ?? 0) + (byStatus['No Show'] ?? 0) }} />
        </StatGrid>
      </View>

      <Panel style={{ marginBottom: 0 }}>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Top Issues Reported</Text>
        <QueryState
          isLoading={statsQuery.isLoading || statsQuery.isFetching}
          isError={statsQuery.isError}
          error={statsQuery.error}
          onRetry={statsQuery.refetch}
          isEmpty={topIssues.length === 0}
          emptyIcon="chart-box-outline"
          emptyLabel="No issues recorded yet"
        >
          {topIssues.map((item) => (
            <View key={item._id} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[typography.body, { color: colors.text }]}>{item._id}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{item.count}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceSoft, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${(item.count / maxCount) * 100}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
              </View>
            </View>
          ))}
        </QueryState>
      </Panel>
    </View>
  );
}

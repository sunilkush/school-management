import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Panel } from '../../components/ui/Panel';
import { DonutChart } from '../../components/charts/DonutChart';
import { STAT_COLORS } from '../../theme/patterns';
import { homeworkStatus } from '../../utils/homework';
import { summarizeAttendance } from '../../utils/attendance';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetChildExamResultsQuery,
  useGetChildHomeworkQuery,
  useGetMyAttendanceQuery,
  useGetMyChildrenQuery,
} from '../../store/api/apiSlice';

/** A composite dashboard, not a single backend endpoint — mirrors
 * frontend/src/pages/Parent/Progress/ChildProgress.jsx, which itself combines the same 3 calls
 * (exam results, attendance, homework) client-side rather than hitting a dedicated /progress
 * route (none exists). */
export function ParentProgressReportView() {
  const { colors, typography, spacing } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const childrenQuery = useGetMyChildrenQuery();
  const children = childrenQuery.data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;
  const childUserId = activeChild?.userId;

  const resultsQuery = useGetChildExamResultsQuery(childUserId, { skip: !childUserId });
  const results = resultsQuery.data ?? [];

  const now = new Date();
  const attendanceQuery = useGetMyAttendanceQuery(
    { childId: childUserId, month: now.getMonth() + 1, year: now.getFullYear() },
    { skip: !childUserId }
  );
  const { percentage: attendancePercentage } = summarizeAttendance(attendanceQuery.data ?? []);

  const homeworkQuery = useGetChildHomeworkQuery(childUserId, { skip: !childUserId });
  const homework = homeworkQuery.data?.homework ?? [];

  const examAverage = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length);
  }, [results]);

  const homeworkBreakdown = useMemo(() => {
    const counts = { submitted: 0, pending: 0, overdue: 0 };
    homework.forEach((item) => {
      counts[homeworkStatus(item)] += 1;
    });
    return [
      { label: 'Submitted', value: counts.submitted, color: STAT_COLORS[0] },
      { label: 'Pending', value: counts.pending, color: STAT_COLORS[1] },
      { label: 'Overdue', value: counts.overdue, color: STAT_COLORS[2] },
    ];
  }, [homework]);

  const isLoading = resultsQuery.isLoading || attendanceQuery.isLoading || homeworkQuery.isLoading;

  return (
    <QueryState
      isLoading={childrenQuery.isLoading}
      isError={childrenQuery.isError}
      error={childrenQuery.error}
      onRetry={childrenQuery.refetch}
      isEmpty={children.length === 0}
      emptyIcon="account-child-outline"
      emptyLabel="No children linked to your account yet"
    >
      <View style={{ marginBottom: spacing.md }}>
        <ChildPicker children={children} selectedId={activeChild?._id} onSelect={setSelectedChild} />
      </View>

      <QueryState isLoading={isLoading} isError={false} isEmpty={false}>
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Attendance" metric={{ label: 'Attendance', icon: 'chart-donut', color: colors.primary, value: attendancePercentage, suffix: '%' }} />
            <StatCard label="Exam Average" metric={{ label: 'Exam Average', icon: 'file-chart-outline', color: '#0891B2', value: examAverage, suffix: '%' }} />
            <StatCard label="Homework Done" metric={{ label: 'Homework Done', icon: 'clipboard-check-outline', color: '#22C55E', value: homeworkBreakdown[0].value }} />
          </StatGrid>
        </View>

        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Homework Completion</Text>
          <DonutChart data={homeworkBreakdown} centerLabel="Homework" />
        </Panel>
      </QueryState>
    </QueryState>
  );
}

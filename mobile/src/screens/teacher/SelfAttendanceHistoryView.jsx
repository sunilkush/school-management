import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetSelfAttendanceHistoryQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { present: '#22C55E', absent: '#EF4444', late: '#F59E0B', halfday: '#F59E0B', leave: '#64748B' };

const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

/** This month's own check-in/out history — GET /attendance/self/history defaults to the current
 * calendar month when no `month` param is passed. */
export function SelfAttendanceHistoryView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSelfAttendanceHistoryQuery();
  const records = data ?? [];

  const presentCount = useMemo(() => records.filter((r) => r.status === 'present').length, [records]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text style={[typography.h3, { color: colors.text }]}>This Month</Text>
        <StatusPill label={`${presentCount}/${records.length} present`} color={colors.success} />
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={records.length === 0}
        emptyIcon="calendar-blank-outline"
        emptyLabel="No attendance records yet this month"
      >
        {records.map((r) => (
          <AccentListCard
            key={r._id}
            accent={STATUS_COLOR[r.status] || colors.textMuted}
            avatar={<IconWell icon="calendar-check-outline" color={STATUS_COLOR[r.status] || colors.textMuted} size={38} />}
            title={formatDate(r.date)}
            subtitle={`In ${fmtTime(r.checkInAt)} · Out ${fmtTime(r.checkOutAt)}`}
            badge={<StatusPill label={r.status} color={STATUS_COLOR[r.status] || colors.textMuted} />}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

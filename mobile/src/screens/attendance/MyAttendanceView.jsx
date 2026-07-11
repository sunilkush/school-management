import React, { useState } from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyAttendanceQuery } from '../../store/api/apiSlice';
import { STATUS_META, monthLabel, summarizeAttendance } from '../../utils/attendance';
import { formatDate } from '../../utils/format';

/** Shared "my attendance" view for both Student (own record) and Parent (childId = a User._id). */
export function MyAttendanceView({ childId, skip = false }) {
  const { colors, typography, spacing } = useAppTheme();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyAttendanceQuery(
    { month, year, childId },
    { skip }
  );

  const goPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const records = data ?? [];
  const { counts, percentage } = summarizeAttendance(records);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <IconButton icon="chevron-left" onPress={goPrevMonth} />
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{monthLabel(month, year)}</Text>
        <IconButton icon="chevron-right" onPress={goNextMonth} />
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={records.length === 0}
        emptyIcon="clipboard-check-outline"
        emptyLabel="No attendance recorded for this month"
      >
        <StatGrid>
          <StatCard label="Attendance" metric={{ value: percentage, suffix: '%', icon: 'chart-donut' }} />
          <StatCard label="Present" metric={{ value: counts.present, icon: STATUS_META.present.icon, color: STATUS_META.present.color }} />
          <StatCard label="Absent" metric={{ value: counts.absent, icon: STATUS_META.absent.icon, color: STATUS_META.absent.color }} />
          <StatCard label="Late / Half Day" metric={{ value: counts.late + counts.halfday, icon: STATUS_META.late.icon, color: STATUS_META.late.color }} />
        </StatGrid>

        <View style={{ marginTop: spacing.lg }}>
          {records.map((record) => {
            const meta = STATUS_META[record.status];
            return (
              <AccentListCard
                key={record._id}
                accent={meta?.color}
                avatar={<IconWell icon={meta?.icon ?? 'help-circle-outline'} color={meta?.color ?? colors.textMuted} size={38} />}
                title={formatDate(record.date)}
                badge={<StatusPill label={meta?.label ?? record.status} color={meta?.color ?? colors.textMuted} />}
              />
            );
          })}
        </View>
      </QueryState>
    </View>
  );
}

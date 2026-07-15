import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatDate, formatDateOnly } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAttendanceRecordsQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { present: '#22C55E', absent: '#EF4444', late: '#F59E0B', halfday: '#F59E0B', leave: '#64748B' };
const ROLE_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'staff', label: 'Staff' },
];

/**
 * Admin-wide attendance browser — the single real destination behind 5 separate web sidebar
 * entries (Attendance Dashboard, Student/Teacher/Staff Attendance, Attendance Table), since all 5
 * are really the same GET /attendance records list filtered a different way. Role filter chips
 * let the admin get to any of those views from here rather than duplicating near-identical screens.
 */
export function AdminAttendanceTableView() {
  const { colors, typography, spacing } = useAppTheme();
  const [role, setRole] = useState(null);
  const [date, setDate] = useState(() => formatDateOnly(new Date()));

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAttendanceRecordsQuery({ role: role || undefined, date, limit: 100 });
  const records = data?.items ?? [];

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === 'present').length;
    return { total: records.length, present, absent: records.filter((r) => r.status === 'absent').length };
  }, [records]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{formatDate(date)}</Text>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>
          {stats.present} present · {stats.absent} absent · {stats.total} total
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        {ROLE_OPTIONS.map((opt) => (
          <Chip key={opt.label} selected={role === opt.value} onPress={() => setRole(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={records.length === 0}
        emptyIcon="clipboard-check-outline"
        emptyLabel="No attendance records for this date"
      >
        {records.map((r) => (
          <AccentListCard
            key={r._id}
            accent={STATUS_COLOR[r.status] || colors.textMuted}
            avatar={<AvatarInitials name={r.userId?.name} size={38} />}
            title={r.userId?.name ?? 'Unknown'}
            subtitle={`${r.role}${r.schoolClassId?.name ? ` · ${r.schoolClassId.name}` : ''}${r.sectionId?.name ? ` ${r.sectionId.name}` : ''}`}
            badge={<StatusPill label={r.status} color={STATUS_COLOR[r.status] || colors.textMuted} />}
            meta={[{ label: 'Marked By', value: r.markedBy?.name ?? '—' }]}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

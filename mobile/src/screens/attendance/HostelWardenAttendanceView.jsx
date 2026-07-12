import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { formatDateOnly } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetTodayHostelAttendanceSheetQuery, useMarkHostelAttendanceMutation } from '../../store/api/apiSlice';

const SESSIONS = ['morning', 'evening', 'night'];
const STATUSES = ['present', 'absent', 'leave'];
const STATUS_COLOR = { present: '#22C55E', absent: '#EF4444', leave: '#F59E0B' };

/** Hostel resident roll-call — distinct from the Dashboard's read-only "Last Attendance" summary
 * panel; this is the actual mark/history CRUD surface. Mirrors
 * frontend/src/pages/HostelWarden/HostelAttendance.jsx. */
export function HostelWardenAttendanceView() {
  const { colors, typography, spacing } = useAppTheme();
  const [session, setSession] = useState('morning');
  const [statuses, setStatuses] = useState({});
  const [snackbar, setSnackbar] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTodayHostelAttendanceSheetQuery({ session });
  const sheet = data?.sheet ?? [];
  const [markAttendance, { isLoading: isSaving }] = useMarkHostelAttendanceMutation();

  useEffect(() => {
    const initial = {};
    sheet.forEach((row) => {
      initial[row.studentId] = row.status || (row.isOnLeave ? 'leave' : 'present');
    });
    setStatuses(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const setStatusFor = (studentId, status) => setStatuses((prev) => ({ ...prev, [studentId]: status }));

  const handleSubmit = async () => {
    try {
      await markAttendance({
        date: formatDateOnly(new Date()),
        session,
        records: sheet.map((row) => ({
          studentId: row.studentId,
          studentName: row.name,
          roomNumber: row.roomNumber,
          status: statuses[row.studentId] || 'present',
        })),
      }).unwrap();
      setSnackbar('Attendance saved');
      refetch();
    } catch (err) {
      setSnackbar(err?.data?.message || 'Failed to save attendance');
    }
  };

  return (
    <View>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{formatDateOnly(new Date())}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        {SESSIONS.map((s) => (
          <Chip key={s} selected={s === session} onPress={() => setSession(s)}>
            {s}
          </Chip>
        ))}
      </ScrollView>

      {data?.alreadyMarked && (
        <Text style={[typography.caption, { color: colors.primary, marginBottom: spacing.sm }]}>
          Already marked for this session — resubmitting will update it.
        </Text>
      )}

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={sheet.length === 0}
        emptyIcon="account-group-outline"
        emptyLabel="No hostel residents allocated yet"
      >
        {sheet.map((row) => (
          <View
            key={row.studentId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            <AvatarInitials name={row.name} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>{row.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                Room {row.roomNumber ?? '—'}{row.isOnLeave ? ' · On approved leave' : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {STATUSES.map((s) => (
                <Chip
                  key={s}
                  compact
                  selected={statuses[row.studentId] === s}
                  selectedColor={STATUS_COLOR[s]}
                  onPress={() => setStatusFor(row.studentId, s)}
                >
                  {s[0].toUpperCase()}
                </Chip>
              ))}
            </View>
          </View>
        ))}

        <Button mode="contained" onPress={handleSubmit} loading={isSaving} disabled={isSaving} style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
          Save Attendance
        </Button>
      </QueryState>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

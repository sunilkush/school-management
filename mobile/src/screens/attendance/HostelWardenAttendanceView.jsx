import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, ProgressBar, SegmentedButtons, Snackbar, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { Panel } from '../../components/ui/Panel';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { formatDate, formatDateOnly } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetHostelAttendanceQuery,
  useGetTodayHostelAttendanceSheetQuery,
  useMarkHostelAttendanceMutation,
} from '../../store/api/apiSlice';

const SESSIONS = ['morning', 'evening', 'night'];
const STATUSES = ['present', 'absent', 'leave'];
const STATUS_COLOR = { present: '#22C55E', absent: '#EF4444', leave: '#F59E0B' };
const HISTORY_LIMIT = 20;

function rateColor(pct) {
  if (pct >= 80) return STATUS_COLOR.present;
  if (pct >= 60) return STATUS_COLOR.leave;
  return STATUS_COLOR.absent;
}

/** Hostel resident roll-call — distinct from the Dashboard's read-only "Last Attendance" summary
 * panel; this is the actual mark/history CRUD surface. Mirrors
 * frontend/src/pages/HostelWarden/HostelAttendance.jsx (Mark/History toggle, per-session stat
 * tiles, attendance-rate progress bar, bulk mark-all actions, paginated history). */
export function HostelWardenAttendanceView() {
  const { colors, typography, spacing } = useAppTheme();
  const [viewMode, setViewMode] = useState('mark');
  const [session, setSession] = useState('morning');
  const [statuses, setStatuses] = useState({});
  const [snackbar, setSnackbar] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTodayHostelAttendanceSheetQuery(
    { session },
    { skip: viewMode !== 'mark' }
  );
  const sheet = data?.sheet ?? [];
  const [markAttendance, { isLoading: isSaving }] = useMarkHostelAttendanceMutation();

  const historyQuery = useGetHostelAttendanceQuery(
    { session, page: historyPage, limit: HISTORY_LIMIT },
    { skip: viewMode !== 'history' }
  );
  const historyRecords = historyQuery.data?.records ?? [];
  const historyTotal = historyQuery.data?.total ?? 0;

  useEffect(() => {
    const initial = {};
    sheet.forEach((row) => {
      initial[row.studentId] = row.status || (row.isOnLeave ? 'leave' : 'present');
    });
    setStatuses(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setHistoryPage(1);
  }, [session]);

  const setStatusFor = (studentId, status) => setStatuses((prev) => ({ ...prev, [studentId]: status }));
  const setAll = (status) => {
    const all = {};
    sheet.forEach((row) => { all[row.studentId] = status; });
    setStatuses(all);
  };

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

  const total = sheet.length;
  const presentCount = Object.values(statuses).filter((s) => s === 'present').length;
  const absentCount = Object.values(statuses).filter((s) => s === 'absent').length;
  const leaveCount = Object.values(statuses).filter((s) => s === 'leave').length;
  const attendancePct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <View>
      <SegmentedButtons
        value={viewMode}
        onValueChange={setViewMode}
        style={{ marginBottom: spacing.md }}
        buttons={[
          { value: 'mark', label: 'Mark Attendance' },
          { value: 'history', label: 'History' },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        {SESSIONS.map((s) => (
          <Chip key={s} selected={s === session} onPress={() => setSession(s)}>
            {s}
          </Chip>
        ))}
      </ScrollView>

      {viewMode === 'mark' ? (
        <>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{formatDateOnly(new Date())}</Text>

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
            <View style={{ marginBottom: spacing.lg }}>
              <StatGrid>
                <StatCard label="Total" metric={{ value: total, icon: 'account-group-outline', color: colors.primary }} />
                <StatCard label="Present" metric={{ value: presentCount, icon: 'check-circle-outline', color: STATUS_COLOR.present }} />
                <StatCard label="Absent" metric={{ value: absentCount, icon: 'close-circle-outline', color: STATUS_COLOR.absent }} />
                <StatCard label="On Leave" metric={{ value: leaveCount, icon: 'calendar-remove-outline', color: STATUS_COLOR.leave }} />
              </StatGrid>
            </View>

            {total > 0 && (
              <Panel>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>Attendance Rate</Text>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{attendancePct}%</Text>
                </View>
                <ProgressBar progress={attendancePct / 100} color={rateColor(attendancePct)} style={{ height: 8, borderRadius: 4 }} />
              </Panel>
            )}

            {sheet.length > 0 && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setAll('present')}
                  textColor={STATUS_COLOR.present}
                  style={{ borderColor: STATUS_COLOR.present, flex: 1 }}
                >
                  Mark All Present
                </Button>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setAll('absent')}
                  textColor={STATUS_COLOR.absent}
                  style={{ borderColor: STATUS_COLOR.absent, flex: 1 }}
                >
                  Mark All Absent
                </Button>
              </View>
            )}

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
        </>
      ) : (
        <QueryState
          isLoading={historyQuery.isLoading || historyQuery.isFetching}
          isError={historyQuery.isError}
          error={historyQuery.error}
          onRetry={historyQuery.refetch}
          isEmpty={historyRecords.length === 0}
          emptyIcon="calendar-blank-outline"
          emptyLabel="No attendance records yet for this session"
        >
          {historyRecords.map((rec) => {
            const t = (rec.totalPresent || 0) + (rec.totalAbsent || 0) + (rec.totalOnLeave || 0);
            const pct = t > 0 ? Math.round((rec.totalPresent / t) * 100) : 0;
            return (
              <Panel key={rec._id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{formatDate(rec.date)}</Text>
                  <Chip compact>{rec.session}</Chip>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm }}>
                  <Text style={{ color: STATUS_COLOR.present, fontWeight: '700' }}>{rec.totalPresent} Present</Text>
                  <Text style={{ color: STATUS_COLOR.absent, fontWeight: '700' }}>{rec.totalAbsent} Absent</Text>
                  <Text style={{ color: STATUS_COLOR.leave, fontWeight: '700' }}>{rec.totalOnLeave} Leave</Text>
                </View>
                <ProgressBar progress={pct / 100} color={rateColor(pct)} style={{ height: 6, borderRadius: 3 }} />
              </Panel>
            );
          })}

          {historyTotal > HISTORY_LIMIT && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xl }}>
              <IconButton icon="chevron-left" onPress={() => setHistoryPage((p) => Math.max(1, p - 1))} disabled={historyPage === 1} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Page {historyPage} of {Math.ceil(historyTotal / HISTORY_LIMIT)}
              </Text>
              <IconButton
                icon="chevron-right"
                onPress={() => setHistoryPage((p) => p + 1)}
                disabled={historyPage * HISTORY_LIMIT >= historyTotal}
              />
            </View>
          )}
        </QueryState>
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { ScopePicker } from '../generic/ScopePicker';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import {
  useGetMyStudentTimetableQuery,
  useGetMyTeacherTimetableQuery,
  useGetChildTimetableQuery,
  useGetMyChildrenQuery,
} from '../../store/api/apiSlice';

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const TEACHER_ROLES = ['Teacher', 'Subject Coordinator', 'Exam Coordinator', 'Lab Technician', 'Class Teacher'];

// Non-teaching periods read differently from lessons — they have no subject or teacher, and
// showing them as blank lesson rows looks like missing data rather than a scheduled break.
const NON_LESSON_TYPES = new Set(['break', 'lunch', 'assembly']);

function todayKey() {
  return DAYS[(new Date().getDay() + 6) % 7].key;
}

function PeriodRow({ entry }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const isLesson = !NON_LESSON_TYPES.has(entry.type);
  const isSubstitution = entry.type === 'substitution';
  const slot = entry.timeSlotId;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        backgroundColor: isLesson ? colors.surface : colors.surfaceSoft,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: isSubstitution ? 4 : 1,
        borderLeftColor: isSubstitution ? colors.warning : colors.border,
      }}
    >
      <View style={{ width: 74 }}>
        <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
          {slot?.startTime ?? '—'}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{slot?.endTime ?? ''}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {isLesson ? entry.subjectId?.name ?? slot?.name ?? 'Free period' : slot?.name ?? entry.type}
        </Text>
        {isLesson ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {[entry.teacherId?.name, entry.roomId?.name].filter(Boolean).join(' · ') || '—'}
          </Text>
        ) : null}
        {entry.note ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{entry.note}</Text>
        ) : null}
      </View>

      {isSubstitution ? (
        <Text style={[typography.caption, { color: colors.warning, fontWeight: '700' }]}>substituted</Text>
      ) : null}
    </View>
  );
}

/**
 * Timetable — one of the few screens that genuinely is not a list.
 *
 * A phone cannot show a 7-day × 8-period grid legibly, so this is day tabs plus that day's
 * periods, opening on today. Same data the web grid renders, arranged for the screen it is on.
 *
 * Substitutions arrive as ordinary rows with `type: 'substitution'` — the backend keeps them as a
 * date-keyed overlay rather than editing the Timetable itself, so nothing special is fetched here;
 * they are just marked so a student can see the period is not with their usual teacher.
 */
export function TimetableScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const ctx = useModuleContext();
  const [day, setDay] = useState(todayKey);
  const [childPick, setChildPick] = useState(null);

  const isParent = ctx.is('Parent');
  const isTeacher = ctx.is(...TEACHER_ROLES);

  const children = useGetMyChildrenQuery(undefined, { skip: !isParent });
  // Student._id here — childTimetable resolves the child with `Student.findById(:studentId)`,
  // unlike the homework/attendance routes which want the child's User id.
  const childOptions = (children.data ?? []).map((child) => ({ value: child._id, label: child.name }));
  const childId = isParent ? childPick ?? childOptions[0]?.value ?? null : null;

  const student = useGetMyStudentTimetableQuery(undefined, { skip: isParent || isTeacher });
  const teacher = useGetMyTeacherTimetableQuery(undefined, { skip: !isTeacher });
  const child = useGetChildTimetableQuery({ studentId: childId }, { skip: !isParent || !childId });

  const result = isTeacher ? teacher : isParent ? child : student;
  const rows = Array.isArray(result.data) ? result.data : [];

  const periods = useMemo(
    () =>
      rows
        .filter((entry) => entry.dayOfWeek === day)
        .sort((a, b) => (a.timeSlotId?.order ?? 0) - (b.timeSlotId?.order ?? 0)),
    [rows, day]
  );

  // Only offer days the school actually runs, so a 5-day school does not show empty Sat/Sun tabs.
  const scheduledDays = useMemo(() => {
    const present = new Set(rows.map((entry) => entry.dayOfWeek));
    const days = DAYS.filter((candidate) => present.has(candidate.key));
    return days.length > 0 ? days : DAYS.slice(0, 6);
  }, [rows]);

  const parentWithNoChildren = isParent && !children.isLoading && childOptions.length === 0;

  return (
    <ScreenContainer>
      {isParent ? <ScopePicker options={childOptions} value={childId} onChange={setChildPick} /> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
      >
        {scheduledDays.map((candidate) => (
          <Chip
            key={candidate.key}
            selected={candidate.key === day}
            showSelectedCheck={false}
            onPress={() => setDay(candidate.key)}
            compact
          >
            {candidate.label}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={result.isLoading || children.isLoading}
        isError={result.isError}
        error={result.error}
        onRetry={result.refetch}
        isEmpty={parentWithNoChildren || periods.length === 0}
        emptyIcon="calendar-blank-outline"
        emptyLabel={
          parentWithNoChildren
            ? 'No children are linked to your account yet'
            : rows.length === 0
              ? 'No timetable has been published yet'
              : 'Nothing scheduled on this day'
        }
      >
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {periods.map((entry) => (
            <PeriodRow key={entry._id} entry={entry} />
          ))}
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>
            {periods.length} period{periods.length === 1 ? '' : 's'} scheduled
          </Text>
        </ScrollView>
      </QueryState>
    </ScreenContainer>
  );
}

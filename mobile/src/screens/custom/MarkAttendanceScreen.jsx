import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import { STATUS_META } from '../../utils/attendance';
import { formatDate, formatDateOnly } from '../../utils/format';
import {
  useGetAssignedClassesQuery,
  useGetActiveAcademicYearQuery,
  useGetStudentsByRoleQuery,
  useMarkBulkAttendanceMutation,
} from '../../store/api/apiSlice';

// The four a teacher actually taps at the start of a lesson. "leave" is an approved absence the
// office records, not something decided standing in front of the class.
const QUICK_STATUSES = ['present', 'absent', 'late', 'halfday'];

function StudentRow({ name, roll, status, onCycle }) {
  const { colors, typography, spacing } = useAppTheme();
  const meta = STATUS_META[status];

  return (
    <Pressable
      onPress={onCycle}
      android_ripple={{ color: colors.borderMuted }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <AvatarInitials name={name} size={38} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        {roll ? <Text style={[typography.caption, { color: colors.textMuted }]}>{roll}</Text> : null}
      </View>
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: `${meta.color}22`,
          minWidth: 84,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: meta.color, fontWeight: '700', fontSize: 12 }}>{meta.label}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Marking a class present — the one screen a teacher opens every single morning, and the clearest
 * example of something the module registry cannot express: it is a roster with per-row state that
 * only exists until you submit it, not a list of records that already exist.
 *
 * Everyone starts **present** and the teacher taps only the exceptions, because that is how the
 * task actually goes. Tapping a row cycles present → absent → late → half day, so the common case
 * is one tap per absentee and no menus.
 *
 * Marks today by default and refuses future dates, matching the backend, which rejects them.
 */
export function MarkAttendanceScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const ctx = useModuleContext();
  const schoolId = ctx.user?.school?._id ?? ctx.user?.schoolId;

  const activeYear = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYear.data?._id ?? activeYear.data?.academicYear?._id;

  const classes = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classList = Array.isArray(classes.data) ? classes.data : classes.data?.classes ?? [];

  const [classId, setClassId] = useState(null);
  const activeClassId = classId ?? classList[0]?._id ?? null;
  const activeClass = classList.find((item) => item._id === activeClassId) ?? null;

  const [sectionId, setSectionId] = useState(null);
  const sections = activeClass?.sections ?? [];
  const activeSectionId = sectionId ?? sections[0]?._id ?? null;

  const roster = useGetStudentsByRoleQuery(
    { schoolId, academicYearId, schoolClassId: activeClassId },
    { skip: !schoolId || !academicYearId || !activeClassId }
  );

  // GET /student/by-role filters by class but not by section, so the section narrowing happens
  // here rather than being silently ignored.
  const students = useMemo(() => {
    const all = roster.data?.students ?? [];
    if (!activeSectionId) return all;
    return all.filter((row) => String(row.sectionId?._id ?? row.sectionId) === String(activeSectionId));
  }, [roster.data, activeSectionId]);

  const [statuses, setStatuses] = useState({});
  // A different class or section is a different register — start it clean rather than carrying
  // the previous roster's marks across, which would submit them against the wrong students.
  useEffect(() => {
    setStatuses({});
  }, [activeClassId, activeSectionId]);

  const [submit, { isLoading: submitting }] = useMarkBulkAttendanceMutation();

  const statusOf = (enrollment) => statuses[enrollment._id] ?? 'present';

  const cycle = (enrollment) => {
    const current = statusOf(enrollment);
    const next = QUICK_STATUSES[(QUICK_STATUSES.indexOf(current) + 1) % QUICK_STATUSES.length];
    setStatuses((prev) => ({ ...prev, [enrollment._id]: next }));
  };

  const counts = useMemo(() => {
    const tally = { present: 0, absent: 0, late: 0, halfday: 0 };
    for (const enrollment of students) tally[statusOf(enrollment)] += 1;
    return tally;
  }, [students, statuses]);

  const onSubmit = () => {
    const records = students
      // markBulkAttendance keys each record by the student's USER id — an enrollment id here
      // would write attendance against a user that does not exist.
      .map((enrollment) => ({
        userId: enrollment.studentId?.userId?._id ?? enrollment.studentId?.userId,
        status: statusOf(enrollment),
      }))
      .filter((record) => record.userId);

    if (records.length === 0) return;

    submit({
      // No schoolId: the backend resolves it from the caller's own token, and sending one only
      // creates a chance of asserting the wrong tenant.
      date: formatDateOnly(new Date()),
      role: 'student',
      schoolClassId: activeClassId,
      sectionId: activeSectionId,
      records,
    })
      .unwrap()
      .then(() => setStatuses({}))
      // errorMiddleware.js already alerts on a rejected mutation.
      .catch(() => {});
  };

  const loading = activeYear.isLoading || classes.isLoading || roster.isLoading;

  return (
    <ScreenContainer>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
        Marking for {formatDate(new Date())}
      </Text>

      {classList.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
        >
          {classList.map((item) => (
            <Chip
              key={item._id}
              selected={item._id === activeClassId}
              showSelectedCheck={false}
              onPress={() => {
                setClassId(item._id);
                setSectionId(null);
              }}
              compact
            >
              {item.name}
            </Chip>
          ))}
        </ScrollView>
      ) : null}

      {sections.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
        >
          {sections.map((section) => (
            <Chip
              key={section._id}
              selected={section._id === activeSectionId}
              showSelectedCheck={false}
              mode={section._id === activeSectionId ? 'flat' : 'outlined'}
              onPress={() => setSectionId(section._id)}
              compact
            >
              {section.name}
            </Chip>
          ))}
        </ScrollView>
      ) : null}

      <QueryState
        isLoading={loading}
        isError={classes.isError || roster.isError}
        error={classes.error || roster.error}
        onRetry={roster.refetch}
        isEmpty={students.length === 0}
        emptyIcon="account-group-outline"
        emptyLabel={
          classList.length === 0
            ? 'You are not assigned to any class yet'
            : 'No active students in this class'
        }
      >
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm }}>
            {QUICK_STATUSES.map((status) => (
              <Text key={status} style={[typography.caption, { color: STATUS_META[status].color, fontWeight: '700' }]}>
                {counts[status]} {STATUS_META[status].label.toLowerCase()}
              </Text>
            ))}
          </View>

          <FlatList
            data={students}
            keyExtractor={(item) => item._id}
            ItemSeparatorComponent={() => <Divider style={{ backgroundColor: colors.borderMuted }} />}
            contentContainerStyle={{ paddingBottom: 92 }}
            renderItem={({ item }) => (
              <StudentRow
                name={item.studentId?.userId?.name ?? 'Student'}
                roll={item.registrationNumber}
                status={statusOf(item)}
                onCycle={() => cycle(item)}
              />
            )}
          />

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
            style={{ position: 'absolute', left: 0, right: 0, bottom: spacing.md }}
          >
            Save attendance for {students.length} student{students.length === 1 ? '' : 's'}
          </Button>
        </>
      </QueryState>
    </ScreenContainer>
  );
}

import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, List, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { ChildPicker } from '../components/ui/ChildPicker';
import { SchoolAdminTimetableView } from './timetable/SchoolAdminTimetableView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { groupTimetableByDay, timetableRowSubtitle, timetableRowTitle } from '../utils/timetable';
import {
  useGetChildTimetableQuery,
  useGetClassDetailsQuery,
  useGetClassSectionTimetableQuery,
  useGetMyChildrenQuery,
  useGetMyStudentTimetableQuery,
  useGetMyTeacherTimetableQuery,
} from '../store/api/apiSlice';

export function TimetableList({ rows }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const days = groupTimetableByDay(rows);

  return (
    <QueryState isLoading={false} isError={false} isEmpty={days.length === 0} emptyIcon="calendar-blank-outline" emptyLabel="No timetable published yet">
      {days.map(({ day, label, rows: dayRows }) => (
        <View key={day} style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.xs }]}>{label}</Text>
          <List.Section style={{ backgroundColor: colors.surface, borderRadius: radii.md, overflow: 'hidden' }}>
            {dayRows.map((row) => (
              <List.Item
                key={row._id}
                title={timetableRowTitle(row)}
                description={timetableRowSubtitle(row)}
                left={(props) => <List.Icon {...props} icon={row.type === 'regular' ? 'book-open-variant' : 'clock-outline'} />}
              />
            ))}
          </List.Section>
        </View>
      ))}
    </QueryState>
  );
}

function StudentTimetableView() {
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyStudentTimetableQuery(academicYearId, {
    skip: !academicYearId,
  });

  if (!academicYearId) {
    return <QueryState isLoading={false} isError isEmpty={false} error={{ message: 'No active academic year on your profile yet.' }} />;
  }

  return (
    <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
      <TimetableList rows={data ?? []} />
    </QueryState>
  );
}

function TeacherTimetableView() {
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyTeacherTimetableQuery(academicYearId);

  return (
    <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
      <TimetableList rows={data ?? []} />
    </QueryState>
  );
}

function ParentTimetableView() {
  const { spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [selectedChild, setSelectedChild] = useState(null);
  const childrenQuery = useGetMyChildrenQuery();
  const children = childrenQuery.data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const timetableQuery = useGetChildTimetableQuery(
    { studentId: activeChild?._id, academicYearId },
    { skip: !activeChild?._id || !academicYearId }
  );

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
      <QueryState
        isLoading={timetableQuery.isLoading || timetableQuery.isFetching}
        isError={timetableQuery.isError}
        error={timetableQuery.error}
        onRetry={timetableQuery.refetch}
        isEmpty={false}
      >
        <TimetableList rows={timetableQuery.data ?? []} />
      </QueryState>
    </QueryState>
  );
}

// Read-only class/section timetable browser — Principal's web PrincipalTimetableOverview.jsx is a
// read-only "view everything" page; School Admin's own SchoolAdminTimetableView is the full
// create/edit/delete builder, deliberately not reused here even though Principal's role IS
// permitted server-side (TIMETABLE_MANAGE), to preserve that read-only/builder UX distinction.
function PrincipalTimetableView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;
  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const timetableQuery = useGetClassSectionTimetableQuery(
    { schoolClassId: classId, sectionId, academicYearId },
    { skip: !classId || !sectionId || !academicYearId }
  );

  return (
    <QueryState
      isLoading={classesQuery.isLoading}
      isError={classesQuery.isError}
      error={classesQuery.error}
      onRetry={classesQuery.refetch}
      isEmpty={classes.length === 0}
      emptyIcon="google-classroom"
      emptyLabel="No classes found"
    >
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
        {classes.map((c) => (
          <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
            {c.name}
          </Chip>
        ))}
      </ScrollView>

      {sections.length > 0 && (
        <>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
            {sections.map((s) => (
              <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id)}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>
        </>
      )}

      {sectionId && (
        <QueryState
          isLoading={timetableQuery.isLoading || timetableQuery.isFetching}
          isError={timetableQuery.isError}
          error={timetableQuery.error}
          onRetry={timetableQuery.refetch}
          isEmpty={false}
        >
          <TimetableList rows={timetableQuery.data ?? []} />
        </QueryState>
      )}
    </QueryState>
  );
}

// Vice Principal's web "timetable" route points at the exact same <PrincipalTimetableOverview />
// component as Principal's — confirmed via frontend/src/main.jsx, both roles share it verbatim.
// Lab Technician's "Lab Schedule" and Class Teacher's "Timetable" are not distinct features at
// all — both are the identical TeacherTimetablePage.jsx/GET /timetable/teacher/my feature Teacher
// uses, just relabeled; backend's allow-list on that route didn't include either role until this
// session's batches.
const HANDLED_ROLES = new Set(['Student', 'Teacher', 'Parent', 'School Admin', 'Principal', 'Vice Principal', 'Lab Technician', 'Class Teacher']);
const TEACHER_TIMETABLE_ROLES = new Set(['Teacher', 'Lab Technician', 'Class Teacher']);

export function TimetableScreen() {
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      {role?.name === 'Student' && <StudentTimetableView />}
      {TEACHER_TIMETABLE_ROLES.has(role?.name) && <TeacherTimetableView />}
      {role?.name === 'Parent' && <ParentTimetableView />}
      {role?.name === 'School Admin' && <SchoolAdminTimetableView />}
      {(role?.name === 'Principal' || role?.name === 'Vice Principal') && <PrincipalTimetableView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="calendar-remove-outline" emptyLabel="Timetable view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

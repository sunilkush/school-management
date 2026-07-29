import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { ChildPicker } from '../components/ui/ChildPicker';
import { IconWell } from '../components/ui/IconWell';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { SchoolAdminTimetableView } from './timetable/SchoolAdminTimetableView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { groupTimetableByDay, timetableRowSubtitle, timetableRowTitle, timetableTypeColor } from '../utils/timetable';
import {
  useGetChildTimetableQuery,
  useGetClassDetailsQuery,
  useGetClassSectionTimetableQuery,
  useGetMyChildrenQuery,
  useGetMyStudentTimetableQuery,
  useGetMyTeacherTimetableQuery,
} from '../store/api/apiSlice';

const NON_TEACHING_TYPES = new Set(['break', 'lunch', 'assembly']);
const TODAY_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

/** Per-entry card — mirrors web's TimetableGrid.jsx TimetableCell colors/content (type-color
 * accent, teacher-initial circle, room chip) but as a vertical card instead of a grid cell, since
 * a 7-day-wide table doesn't fit a phone screen; a day-grouped agenda list is the mobile-native
 * equivalent of the same weekly schedule. */
function TimetableEntryCard({ row }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const color = timetableTypeColor(row.type);
  const isNonTeaching = NON_TEACHING_TYPES.has(row.type);
  const teacherName = row.teacherId?.name;
  const roomName = row.roomId?.name;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: `${color}10`,
        borderWidth: 1,
        borderColor: `${color}35`,
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderRadius: radii.md,
        padding: spacing.sm,
        marginBottom: spacing.xs,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.bodyStrong, { color, textTransform: isNonTeaching ? 'capitalize' : 'none' }]} numberOfLines={1}>
          {timetableRowTitle(row)}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
          {timetableRowSubtitle(row) || '—'}
        </Text>
      </View>

      {!isNonTeaching && teacherName && <AvatarInitials name={teacherName} size={26} />}
      {roomName && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <MaterialCommunityIcons name="door" size={12} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>{roomName}</Text>
        </View>
      )}
    </View>
  );
}

export function TimetableList({ rows }) {
  const { colors, typography, spacing } = useAppTheme();
  const days = groupTimetableByDay(rows);

  return (
    <QueryState isLoading={false} isError={false} isEmpty={days.length === 0} emptyIcon="calendar-blank-outline" emptyLabel="No timetable published yet">
      {days.map(({ day, label, rows: dayRows }) => {
        const isToday = day === TODAY_KEY;
        return (
          <View key={day} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Text style={[typography.bodyStrong, { color: isToday ? colors.primary : colors.text }]}>{label}</Text>
              {isToday && (
                <View style={{ backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: `${colors.primary}40`, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>TODAY</Text>
                </View>
              )}
            </View>
            {dayRows.map((row) => (
              <TimetableEntryCard key={row._id} row={row} />
            ))}
          </View>
        );
      })}
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
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();
  const isBuilder = role?.name === 'School Admin';

  return (
    <ScreenContainer scrollable>
      {/* Web's own timetable pages (StudentTimetablePage.jsx etc.) use a plain title+subtitle Card,
          not the full icon-well page header — matched at that same weight here rather than
          over-decorating a page web itself keeps simple. School Admin's builder gets its own
          header from SchoolAdminTimetableView, so it's skipped here to avoid a duplicate. */}
      {!isBuilder && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconWell icon="calendar-clock-outline" color={colors.primary} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[typography.h2, { color: colors.text }]}>Timetable</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
              {role?.name === 'Student' || role?.name === 'Parent' ? 'Weekly class timetable' : 'Weekly teaching schedule'}
            </Text>
          </View>
        </View>
      )}

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

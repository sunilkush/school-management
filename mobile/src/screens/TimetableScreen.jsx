import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { List, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { ChildPicker } from '../components/ui/ChildPicker';
import { SchoolAdminTimetableView } from './timetable/SchoolAdminTimetableView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { groupTimetableByDay, timetableRowSubtitle, timetableRowTitle } from '../utils/timetable';
import {
  useGetChildTimetableQuery,
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

const HANDLED_ROLES = new Set(['Student', 'Teacher', 'Parent', 'School Admin']);

export function TimetableScreen() {
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      {role?.name === 'Student' && <StudentTimetableView />}
      {role?.name === 'Teacher' && <TeacherTimetableView />}
      {role?.name === 'Parent' && <ParentTimetableView />}
      {role?.name === 'School Admin' && <SchoolAdminTimetableView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="calendar-remove-outline" emptyLabel="Timetable view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { TimetableList } from '../TimetableScreen';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAllUsersQuery, useGetTeacherTimetableForQuery } from '../../store/api/apiSlice';

/** Read-only view of any teacher's own weekly schedule — mirrors the web app's
 * School_Admin/Timetables/TeacherTimetable.jsx (teacher picker + day-grouped list). Changes still
 * have to be made from the Class Timetable builder, same restriction as the web page. Reuses
 * TimetableScreen's own TimetableList, so entries already get the same type-colored cards. */
export function TeacherTimetableView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  const [teacherId, setTeacherId] = useState(null);

  const teachersQuery = useGetAllUsersQuery({ schoolId, academicYearId, roleName: 'Teacher' }, { skip: !schoolId });
  const teachers = teachersQuery.data ?? [];

  const timetableQuery = useGetTeacherTimetableForQuery(
    { teacherId, academicYearId },
    { skip: !teacherId }
  );

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-tie-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Teacher Timetable</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            View any teacher's weekly teaching schedule
          </Text>
        </View>
      </View>

      <Panel>
        <QueryState
          isLoading={teachersQuery.isLoading}
          isError={teachersQuery.isError}
          error={teachersQuery.error}
          onRetry={teachersQuery.refetch}
          isEmpty={teachers.length === 0}
          emptyIcon="account-tie-outline"
          emptyLabel="No teachers found"
        >
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TEACHER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
            {teachers.map((t) => (
              <Chip key={t._id} selected={t._id === teacherId} onPress={() => setTeacherId(t._id)}>
                {t.name}
              </Chip>
            ))}
          </ScrollView>
        </QueryState>
      </Panel>

      {teacherId && (
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
    </ScreenContainer>
  );
}

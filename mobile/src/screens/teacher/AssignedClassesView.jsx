import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAssignedClassesQuery } from '../../store/api/apiSlice';

/** Read-only "which classes/sections/subjects do I teach" view — the same data source already
 * powering the class/section picker in CreateHomeworkSheet, surfaced here as its own destination
 * (web sidebar's "Classroom" > class list). */
export function AssignedClassesView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={classes.length === 0}
        emptyIcon="google-classroom"
        emptyLabel="No classes assigned to you yet"
      >
        {classes.map((cls) => (
          <AccentListCard
            key={cls._id}
            accent={colors.primary}
            avatar={<IconWell icon="google-classroom" color={colors.primary} size={40} />}
            title={cls.name}
            subtitle={cls.subjects?.map((s) => s.subjectId?.name).filter(Boolean).join(', ') || 'No subjects'}
            badge={cls.role?.includes('class_teacher') ? <StatusPill label="Class Teacher" color={colors.accent} /> : null}
            meta={(cls.sections ?? []).map((sec) => ({
              label: `Section ${sec.sectionId?.name ?? ''}`,
              value: `${sec.subjects?.map((s) => s.subjectId?.name).filter(Boolean).join(', ') || 'No subjects'} · ${sec.studentCount} students`,
            }))}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateLessonPlanSheet } from './CreateLessonPlanSheet';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAssignedClassesQuery, useGetLessonPlansQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { draft: '#94A3B8', approved: '#2563EB', completed: '#22C55E' };

export function LessonPlansView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [creating, setCreating] = useState(false);

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetLessonPlansQuery({ academicYearId }, { skip: !academicYearId });
  const plans = data?.items ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Lesson Plan
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={plans.length === 0}
        emptyIcon="notebook-outline"
        emptyLabel="No lesson plans yet"
      >
        {plans.map((plan) => (
          <AccentListCard
            key={plan._id}
            accent={STATUS_COLOR[plan.status] || colors.primary}
            avatar={<IconWell icon="notebook-outline" color={STATUS_COLOR[plan.status] || colors.primary} size={40} />}
            title={plan.title}
            subtitle={`${plan.schoolClassId?.name ?? ''}${plan.sectionId?.name ? ` · ${plan.sectionId.name}` : ''} · ${plan.subjectId?.name ?? ''}`}
            badge={<StatusPill label={plan.status} color={STATUS_COLOR[plan.status] || colors.textMuted} />}
            meta={[
              { label: 'Planned Date', value: formatDate(plan.plannedDate) },
              { label: 'Duration', value: `${plan.duration} min` },
              ...(plan.objectives ? [{ label: 'Objectives', value: plan.objectives }] : []),
            ]}
            expandable
          />
        ))}
      </QueryState>

      <CreateLessonPlanSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}

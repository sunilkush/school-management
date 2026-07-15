import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateExamSheet } from './CreateExamSheet';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetClassDetailsQuery, useGetExamsQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { draft: '#94A3B8', published: '#2563EB', completed: '#22C55E' };

/** Exam creation + schedule — covers 3 web sidebar entries (Exams, Create Exam, Exam Schedule).
 * ExamSchedule.jsx on the web is confirmed to dispatch the exact same createExam/getExams thunks
 * as CreateExam.jsx, just presented as a calendar — this is the same single feature, presented as
 * a date-sorted agenda list instead of a calendar-grid component. */
export function ExamManagementView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;
  const [creating, setCreating] = useState(false);

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const classes = classesQuery.data ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = useMemo(() => [...(data?.exams ?? [])].sort((a, b) => new Date(a.examDate) - new Date(b.examDate)), [data]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Exam
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams scheduled yet"
      >
        {exams.map((exam) => (
          <AccentListCard
            key={exam._id}
            accent={STATUS_COLOR[exam.status] || colors.primary}
            avatar={<IconWell icon="pencil-box-outline" color={STATUS_COLOR[exam.status] || colors.primary} size={40} />}
            title={exam.title}
            subtitle={`${exam.schoolClassId?.name ?? ''}${exam.sectionId?.name ? ` ${exam.sectionId.name}` : ''} · ${exam.subjectId?.name ?? ''}`}
            badge={<StatusPill label={exam.status} color={STATUS_COLOR[exam.status] || colors.textMuted} />}
            meta={[
              { label: 'Date', value: formatDate(exam.examDate) },
              { label: 'Marks', value: `${exam.totalMarks} (pass ${exam.passingMarks})` },
              ...(exam.examType ? [{ label: 'Type', value: exam.examType }] : []),
            ]}
            expandable
          />
        ))}
      </QueryState>

      <CreateExamSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}

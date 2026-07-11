import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { pillStyle } from '../../theme/patterns';
import { EXAM_STATUS_META } from '../../utils/exams';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetExamsQuery } from '../../store/api/apiSlice';

export function ExamListSection({ academicYearId, studentId, skip }) {
  const { typography } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetExamsQuery({ academicYearId, studentId }, { skip });
  const exams = data?.exams ?? [];

  return (
    <QueryState
      isLoading={isLoading || isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={exams.length === 0}
      emptyIcon="pencil-box-outline"
      emptyLabel="No exams scheduled yet"
    >
      {exams.map((exam) => {
        const meta = EXAM_STATUS_META[exam.status] ?? EXAM_STATUS_META.draft;
        return (
          <AccentListCard
            key={exam._id}
            accent={meta.color}
            avatar={<IconWell icon="pencil-box-outline" color={meta.color} size={38} />}
            title={exam.title}
            subtitle={`${exam.subjectId?.name ?? 'Subject'} · ${exam.schoolClassId?.name ?? ''}${exam.sectionId?.name ? ` ${exam.sectionId.name}` : ''}`}
            badge={
              <View style={pillStyle(meta.color)}>
                <Text style={[typography.caption, { color: meta.color, fontWeight: '700', fontSize: 10.5 }]}>{meta.label}</Text>
              </View>
            }
            meta={[
              { label: 'Date', value: formatDate(exam.examDate) },
              { label: 'Total Marks', value: exam.totalMarks },
            ]}
            expandable
          />
        );
      })}
    </QueryState>
  );
}

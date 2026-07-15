import React from 'react';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { QueryState } from '../../components/ui/QueryState';
import { resultStatusColor } from '../../utils/exams';
import { formatDate } from '../../utils/format';

export function ExamResultsSection({ query }) {
  const { data, isLoading, isFetching, isError, error, refetch } = query;
  const results = data ?? [];

  return (
    <QueryState
      isLoading={isLoading || isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={results.length === 0}
      emptyIcon="file-chart-outline"
      emptyLabel="No published results yet"
    >
      {results.map((r) => {
        const color = resultStatusColor(r.resultStatus);
        return (
          <AccentListCard
            key={r._id}
            accent={color}
            avatar={<IconWell icon="file-chart-outline" color={color} size={38} />}
            title={r.examId?.title ?? 'Exam'}
            subtitle={`${formatDate(r.examId?.examDate)} · ${r.percentage}% · Grade ${r.grade}`}
            badge={<StatusPill label={r.resultStatus} color={color} />}
            meta={(r.subjects ?? []).map((s) => ({
              label: s.subjectName,
              value: `${s.obtainedMarks}/${s.totalMarks}${s.isPassed ? '' : ' (Fail)'}`,
            }))}
            expandable
          />
        );
      })}
    </QueryState>
  );
}

import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { HomeworkSubmitSheet } from './HomeworkSubmitSheet';
import { HOMEWORK_STATUS_META, homeworkStatus } from '../../utils/homework';
import { formatDate } from '../../utils/format';
import { useGetMyHomeworkQuery } from '../../store/api/apiSlice';

export function StudentHomeworkView() {
  const [submitting, setSubmitting] = useState(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyHomeworkQuery();
  const homework = data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={homework.length === 0}
        emptyIcon="clipboard-text-outline"
        emptyLabel="No homework assigned yet"
      >
        {homework.map((item) => {
          const status = homeworkStatus(item);
          const meta = HOMEWORK_STATUS_META[status];
          return (
            <AccentListCard
              key={item._id}
              accent={meta.color}
              avatar={<IconWell icon={meta.icon} color={meta.color} size={40} />}
              title={item.title}
              subtitle={`${item.subjectId?.name ?? 'Subject'} · Due ${formatDate(item.dueDate)}`}
              badge={<StatusPill label={meta.label} color={meta.color} />}
              meta={[{ label: 'Description', value: item.description }]}
              expandable
              actions={
                status !== 'submitted' ? (
                  <Button mode="contained" compact onPress={() => setSubmitting(item)}>
                    Submit
                  </Button>
                ) : null
              }
            />
          );
        })}
      </QueryState>

      <HomeworkSubmitSheet assignment={submitting} onDismiss={() => setSubmitting(null)} onSubmitted={() => setSubmitting(null)} />
    </ScreenContainer>
  );
}

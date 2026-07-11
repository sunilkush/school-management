import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { GradeSubmissionSheet } from './GradeSubmissionSheet';
import { formatDate } from '../../utils/format';
import { useGetHomeworkSubmissionsQuery } from '../../store/api/apiSlice';

export function HomeworkSubmissionsView({ route }) {
  const { assignmentId } = route.params ?? {};
  const [grading, setGrading] = useState(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetHomeworkSubmissionsQuery(assignmentId, { skip: !assignmentId });
  const submissions = data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={submissions.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel="No submissions yet"
      >
        {submissions.map((sub) => {
          const student = sub.studentEnrollmentId?.studentId?.userId;
          const graded = sub.grade != null;
          return (
            <AccentListCard
              key={sub._id}
              accent={graded ? '#22C55E' : '#F59E0B'}
              avatar={<AvatarInitials name={student?.name} size={40} />}
              title={student?.name ?? 'Student'}
              subtitle={`Submitted ${formatDate(sub.submittedAt)}`}
              badge={graded ? <StatusPill label={`Grade: ${sub.grade}`} color="#22C55E" /> : <StatusPill label="Ungraded" color="#F59E0B" />}
              meta={[{ label: 'Remarks', value: sub.remarks || '—' }, { label: 'Feedback', value: sub.feedback || '—' }]}
              expandable
              actions={
                <Button mode={graded ? 'outlined' : 'contained'} compact onPress={() => setGrading(sub)}>
                  {graded ? 'Edit Grade' : 'Grade'}
                </Button>
              }
            />
          );
        })}
      </QueryState>

      <GradeSubmissionSheet submission={grading} onDismiss={() => setGrading(null)} onGraded={() => setGrading(null)} />
    </ScreenContainer>
  );
}

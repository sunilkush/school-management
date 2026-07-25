import React, { useState } from 'react';
import { View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StudentExamCard } from './StudentExamCard';
import { ExamResultsSection } from './ExamResultsSection';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetExamAttemptsQuery,
  useGetExamsQuery,
  useGetMyExamResultsQuery,
  useStartExamAttemptMutation,
} from '../../store/api/apiSlice';

export function StudentExamsView({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;

  const examsQuery = useGetExamsQuery({ academicYearId });
  const attemptsQuery = useGetExamAttemptsQuery({ status: 'in_progress', limit: 100 });
  const resultsQuery = useGetMyExamResultsQuery();
  const [startAttempt, startState] = useStartExamAttemptMutation();
  const [starting, setStarting] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const exams = examsQuery.data?.exams ?? [];
  const inProgress = Array.isArray(attemptsQuery.data) ? attemptsQuery.data : [];
  const inProgressMap = new Map(inProgress.map((a) => [`${a.examId?._id || a.examId}`, a]));

  const handleStart = async (examId) => {
    setStarting(examId);
    try {
      const attempt = await startAttempt(examId).unwrap();
      navigation.navigate('ExamTake', { attemptId: attempt._id });
    } catch (err) {
      setSnackbar(err?.data?.message || err?.message || 'Unable to start exam');
    } finally {
      setStarting(null);
    }
  };

  const handleResume = (attemptId) => navigation.navigate('ExamTake', { attemptId });
  const handleReview = (attemptId) => navigation.navigate('ExamAttemptReview', { attemptId });

  return (
    <View>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Upcoming Exams</Text>
      <QueryState
        isLoading={examsQuery.isLoading || examsQuery.isFetching}
        isError={examsQuery.isError}
        error={examsQuery.error}
        onRetry={examsQuery.refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams scheduled yet"
      >
        {exams.map((exam) => (
          <StudentExamCard
            key={exam._id}
            exam={exam}
            attempt={inProgressMap.get(`${exam._id}`)}
            starting={starting === exam._id && startState.isLoading}
            onStart={handleStart}
            onResume={handleResume}
            onReview={handleReview}
          />
        ))}
      </QueryState>

      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Results</Text>
      <ExamResultsSection query={resultsQuery} />

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)} duration={3500} style={{ backgroundColor: colors.danger }}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

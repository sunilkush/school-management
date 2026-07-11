import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ExamListSection } from './ExamListSection';
import { ExamResultsSection } from './ExamResultsSection';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyExamResultsQuery } from '../../store/api/apiSlice';

/** Online exam-taking (ExamLive.jsx on web — a full timed-quiz engine) is deferred; this is the
 * read-only "which exams are coming up" + "my published results" view. */
export function StudentExamsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const resultsQuery = useGetMyExamResultsQuery();

  return (
    <View>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Upcoming Exams</Text>
      <ExamListSection academicYearId={user?.academicYear?._id} />

      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Results</Text>
      <ExamResultsSection query={resultsQuery} />
    </View>
  );
}

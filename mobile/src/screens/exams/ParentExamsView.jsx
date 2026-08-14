import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { ExamListSection } from './ExamListSection';
import { ExamResultsSection } from './ExamResultsSection';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetChildExamResultsQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';

// ExamResult.studentId (and getExamsService's Parent branch) both resolve via the child's
// User._id, not Student._id — same bridge field used by ParentAttendanceView (activeChild.userId).
export function ParentExamsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const [selectedChild, setSelectedChild] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const resultsQuery = useGetChildExamResultsQuery(activeChild?.userId, { skip: !activeChild?.userId });

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={children.length === 0}
      emptyIcon="account-child-outline"
      emptyLabel="No children linked to your account yet"
    >
      <View style={{ marginBottom: spacing.md }}>
        <ChildPicker children={children} selectedId={activeChild?._id} onSelect={setSelectedChild} />
      </View>

      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Upcoming Exams</Text>
      <ExamListSection academicYearId={activeYearQuery.data?._id} studentId={activeChild?.userId} skip={!activeChild?.userId} />

      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Results</Text>
      <ExamResultsSection query={resultsQuery} />
    </QueryState>
  );
}

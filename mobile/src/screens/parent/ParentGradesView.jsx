import React, { useState } from 'react';
import { View } from 'react-native';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { ExamResultsSection } from '../exams/ExamResultsSection';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetChildExamResultsQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';

/** Parent's view of a child's report card — same ExamResult data ParentExamsView's Results
 * section already shows, just its own dedicated destination. */
export function ParentGradesView() {
  const { spacing } = useAppTheme();
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
      <ExamResultsSection query={resultsQuery} />
    </QueryState>
  );
}

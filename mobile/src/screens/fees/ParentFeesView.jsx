import React, { useState } from 'react';
import { View } from 'react-native';
import { QueryState } from '../../components/ui/QueryState';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyChildrenQuery } from '../../store/api/apiSlice';
import { FeesContent } from './FeesContent';

export function ParentFeesView() {
  const { spacing } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

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
      {/* /student/my-children doesn't include an academicYearId per child — omitted (optional param). */}
      <FeesContent studentId={activeChild?._id} academicYearId={undefined} />
    </QueryState>
  );
}

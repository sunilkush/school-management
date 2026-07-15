import React, { useState } from 'react';
import { View } from 'react-native';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyChildrenQuery } from '../../store/api/apiSlice';
import { MyAttendanceView } from './MyAttendanceView';

export function ParentAttendanceView() {
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
      {/* Attendance is keyed by User._id server-side, while ChildPicker/getMyChildren identifies
          children by Student._id — activeChild.userId is the field that bridges the two. */}
      <MyAttendanceView childId={activeChild?.userId} skip={!activeChild?.userId} />
    </QueryState>
  );
}

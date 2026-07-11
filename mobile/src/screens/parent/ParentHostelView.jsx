import React, { useState } from 'react';
import { View } from 'react-native';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetChildHostelQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';

/** Parent's view of a child's hostel allocation — identical shape to Student's own MyHostelView. */
export function ParentHostelView() {
  const { colors, spacing } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const hostelQuery = useGetChildHostelQuery(activeChild?.userId, { skip: !activeChild?.userId });
  const hostel = hostelQuery.data;

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

      <QueryState
        isLoading={hostelQuery.isLoading || hostelQuery.isFetching}
        isError={hostelQuery.isError}
        error={hostelQuery.error}
        onRetry={hostelQuery.refetch}
        isEmpty={!hostel}
        emptyIcon="home-city-outline"
        emptyLabel="This child has not been allocated a hostel room"
      >
        {hostel && (
          <StatGrid>
            <StatCard label="Room" metric={{ label: 'Room', icon: 'door', color: colors.primary, value: hostel.roomNumber ?? '—' }} />
            <StatCard label="Capacity" metric={{ label: 'Capacity', icon: 'bed', color: '#14B8A6', value: hostel.capacity ?? '—' }} />
            <StatCard label="Status" metric={{ label: 'Status', icon: 'check-circle-outline', color: '#22C55E', value: hostel.status ?? '—' }} />
          </StatGrid>
        )}
      </QueryState>
    </QueryState>
  );
}

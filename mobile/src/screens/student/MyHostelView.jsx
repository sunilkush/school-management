import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyHostelQuery } from '../../store/api/apiSlice';

/** Student's own hostel allocation. Only roomNumber/capacity/status are real fields server-side —
 * the web app's own ChildHostel.jsx speculatively renders hostelName/bedNumber/floor/wardenName,
 * none of which actually exist in the response; not reproduced here. */
export function MyHostelView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyHostelQuery();

  return (
    <QueryState
      isLoading={isLoading || isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!data}
      emptyIcon="home-city-outline"
      emptyLabel="You have not been allocated a hostel room yet"
    >
      {data && (
        <View>
          <StatGrid>
            <StatCard label="Room" metric={{ label: 'Room', icon: 'door', color: colors.primary, value: data.roomNumber ?? '—' }} />
            <StatCard label="Capacity" metric={{ label: 'Capacity', icon: 'bed', color: '#14B8A6', value: data.capacity ?? '—' }} />
            <StatCard label="Status" metric={{ label: 'Status', icon: 'check-circle-outline', color: '#22C55E', value: data.status ?? '—' }} />
          </StatGrid>
        </View>
      )}
    </QueryState>
  );
}

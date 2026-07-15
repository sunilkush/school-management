import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetChildTransportQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';

/** Parent's view of a child's transport assignment — identical response shape to Student's own
 * MyTransportView, just child-scoped. */
export function ParentTransportView() {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const transportQuery = useGetChildTransportQuery(activeChild?.userId, { skip: !activeChild?.userId });
  const assignment = transportQuery.data?.assignment;
  const route = assignment?.routeId;
  const vehicle = assignment?.vehicleId;

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
        isLoading={transportQuery.isLoading || transportQuery.isFetching}
        isError={transportQuery.isError}
        error={transportQuery.error}
        onRetry={transportQuery.refetch}
        isEmpty={!assignment}
        emptyIcon="bus-school"
        emptyLabel="No transport has been assigned to this child yet"
      >
        {assignment && (
          <>
            <View style={{ marginBottom: spacing.lg }}>
              <StatGrid>
                <StatCard label="Route" metric={{ label: 'Route', icon: 'map-marker-path', color: colors.primary, value: route?.name ?? '—' }} />
                <StatCard label="Vehicle No." metric={{ label: 'Vehicle No.', icon: 'bus', color: '#0891B2', value: vehicle?.busNumber ?? '—' }} />
                <StatCard label="Status" metric={{ label: 'Status', icon: 'check-circle-outline', color: '#22C55E', value: vehicle?.status ?? '—' }} />
              </StatGrid>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md }}>
              <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Vehicle Details</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Type: {vehicle?.vehicleType ?? '—'}</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Capacity: {vehicle?.capacity ?? '—'}</Text>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md }}>
              <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Driver Info</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{vehicle?.driverName ?? '—'}</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{vehicle?.driverContact ?? '—'}</Text>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }}>
              <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Route Details</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
                Pickup: {assignment.pickupStop ?? '—'} · Drop: {assignment.dropStop ?? '—'}
              </Text>
              {(route?.stops ?? []).map((stop, i) => (
                <Text
                  key={i}
                  style={[
                    typography.body,
                    {
                      color: stop === assignment.pickupStop || stop === assignment.dropStop ? colors.primary : colors.textSecondary,
                      fontWeight: stop === assignment.pickupStop || stop === assignment.dropStop ? '700' : '400',
                    },
                  ]}
                >
                  {i + 1}. {stop}
                </Text>
              ))}
            </View>
          </>
        )}
      </QueryState>
    </QueryState>
  );
}

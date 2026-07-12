import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateMaintenanceSheet } from './transport/CreateMaintenanceSheet';
import { formatCurrency, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetMaintenanceRecordsQuery, useGetMaintenanceStatsQuery, useUpdateMaintenanceRecordMutation } from '../store/api/apiSlice';

const STATUS_COLOR = { Scheduled: '#2563EB', 'In Progress': '#F59E0B', Completed: '#22C55E', Cancelled: '#94A3B8' };

/** Vehicle service scheduling — mirrors frontend/src/pages/Transport/TransportPages.jsx's
 * VehicleMaintenance section, a separate model/mount from the Routes/Vehicles fleet screens. */
export function FuelMaintenanceScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const statsQuery = useGetMaintenanceStatsQuery();
  const stats = statsQuery.data ?? {};

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMaintenanceRecordsQuery({});
  const records = data?.records ?? [];
  const [updateRecord, updateState] = useUpdateMaintenanceRecordMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="wrench-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Fuel & Maintenance</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Completed This Month" metric={{ label: 'Completed This Month', icon: 'check-circle-outline', color: '#22C55E', value: stats.completedThisMonth ?? 0 }} />
          <StatCard label="Scheduled" metric={{ label: 'Scheduled', icon: 'calendar-clock-outline', color: '#2563EB', value: stats.scheduled ?? 0 }} />
          <StatCard label="Cost This Month" metric={{ label: 'Cost This Month', icon: 'cash-multiple', color: '#7C3AED', value: stats.totalCostThisMonth ?? 0, format: 'currency' }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Schedule Service
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={records.length === 0}
        emptyIcon="wrench-outline"
        emptyLabel="No maintenance records yet"
      >
        {records.map((r) => (
          <AccentListCard
            key={r._id}
            accent={STATUS_COLOR[r.status] || colors.primary}
            avatar={<IconWell icon="wrench-outline" color={STATUS_COLOR[r.status] || colors.primary} size={40} />}
            title={r.vehicleName || r.vehicleNo || 'Vehicle'}
            subtitle={r.serviceType}
            badge={<StatusPill label={r.status} color={STATUS_COLOR[r.status] || colors.textMuted} />}
            meta={[
              { label: 'Scheduled', value: formatDate(r.scheduledDate) },
              { label: 'Est. Cost', value: formatCurrency(r.estimatedCost ?? 0) },
              ...(r.actualCost != null ? [{ label: 'Actual Cost', value: formatCurrency(r.actualCost) }] : []),
              ...(r.notes ? [{ label: 'Notes', value: r.notes }] : []),
            ]}
            expandable
            actions={
              r.status !== 'Completed' ? (
                <Button
                  size="small"
                  mode="contained-tonal"
                  onPress={() => updateRecord({ id: r._id, status: 'Completed' })}
                  loading={updateState.isLoading}
                  disabled={updateState.isLoading}
                >
                  Mark Done
                </Button>
              ) : null
            }
          />
        ))}
      </QueryState>

      <CreateMaintenanceSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

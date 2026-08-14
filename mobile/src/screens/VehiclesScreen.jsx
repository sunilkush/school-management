import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateVehicleSheet } from './transport/CreateVehicleSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import { useDeleteVehicleMutation, useGetVehiclesQuery } from '../store/api/apiSlice';

// backend/src/models/Transport.model.js status enum.
const STATUS_COLORS = { Available: '#22C55E', 'In Use': '#2563EB', Maintenance: '#F59E0B' };
const TYPE_ICONS = { Bus: 'bus-school', Van: 'van-passenger', Car: 'car-outline' };

/** Mirrors frontend/src/pages/School_Admin/Transport/Vehicles.jsx. */
export function VehiclesScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetVehiclesQuery();
  const [deleteVehicle, deleteState] = useDeleteVehicleMutation();
  const vehicles = data ?? [];
  const sheetVisible = creating || Boolean(editingVehicle);
  const closeSheet = () => { setCreating(false); setEditingVehicle(null); };

  const stats = [
    { key: 'total', label: 'Total Vehicles', icon: 'bus-multiple', color: colors.primary, value: vehicles.length },
    { key: 'available', label: 'Available', icon: 'check-circle-outline', color: '#22C55E', value: vehicles.filter((v) => v.status === 'Available').length },
    { key: 'maintenance', label: 'In Maintenance', icon: 'wrench-outline', color: '#F59E0B', value: vehicles.filter((v) => v.status === 'Maintenance').length },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="bus-multiple" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Vehicles</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Transport fleet for this school
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Add Vehicle
        </Button>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={vehicles.length === 0}
        emptyIcon="bus-alert"
        emptyLabel="No vehicles added yet"
      >
        {vehicles.map((v) => {
          const statusColor = STATUS_COLORS[v.status] ?? colors.textMuted;
          return (
            <AccentListCard
              key={v._id}
              accent={statusColor}
              avatar={<IconWell icon={TYPE_ICONS[v.vehicleType] ?? 'bus-school'} color={colors.primary} size={38} />}
              title={v.busNumber}
              subtitle={`${v.vehicleType} · ${v.driverName}`}
              badge={<StatusPill label={v.status} color={statusColor} />}
              meta={[
                { label: 'Driver Contact', value: v.driverContact },
                { label: 'Capacity', value: v.capacity },
                { label: 'Route', value: v.route },
              ]}
              expandable
              actions={
                <View style={{ flexDirection: 'row' }}>
                  <IconButton
                    icon="pencil-outline"
                    iconColor={colors.textSecondary}
                    size={18}
                    onPress={() => setEditingVehicle(v)}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={colors.danger}
                    size={18}
                    disabled={deleteState.isLoading}
                    onPress={() => confirmDelete(() => deleteVehicle(v._id), 'this vehicle')}
                  />
                </View>
              }
            />
          );
        })}
      </QueryState>

      <CreateVehicleSheet visible={sheetVisible} vehicle={editingVehicle} onDismiss={closeSheet} onCreated={closeSheet} />
    </ScreenContainer>
  );
}

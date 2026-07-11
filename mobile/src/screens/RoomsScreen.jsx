import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { CreateRoomSheet } from './hostel/CreateRoomSheet';
import { RoomDetailSheet } from './hostel/RoomDetailSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteHostelRoomMutation, useGetHostelRoomsQuery } from '../store/api/apiSlice';

/** Mirrors frontend/src/pages/School_Admin/Hostel/HostelManagement.jsx (rooms view). Editing a
 * room's number/capacity is deferred (create + delete + assign/unassign covers the core
 * workflow). */
export function RoomsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetHostelRoomsQuery();
  const [deleteRoom, deleteState] = useDeleteHostelRoomMutation();
  const rooms = data ?? [];

  // Keep the detail sheet's data fresh after an assign/unassign invalidates the list.
  const activeRoom = selectedRoom ? rooms.find((r) => r._id === selectedRoom._id) ?? selectedRoom : null;

  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + (r.students?.length || 0), 0);

  const stats = [
    { key: 'total', label: 'Total Rooms', icon: 'door', color: colors.primary, value: rooms.length },
    { key: 'occupied', label: 'Occupied Beds', icon: 'bed', color: '#F59E0B', value: totalOccupied },
    { key: 'vacant', label: 'Vacant Beds', icon: 'bed-empty', color: '#22C55E', value: Math.max(totalCapacity - totalOccupied, 0) },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="door" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Hostel Rooms</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Room allocation for this school
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Add Room
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
        isEmpty={rooms.length === 0}
        emptyIcon="door-closed"
        emptyLabel="No rooms added yet"
      >
        {rooms.map((r) => {
          const occupied = r.students?.length ?? 0;
          const full = occupied >= r.capacity;
          return (
            <AccentListCard
              key={r._id}
              accent={full ? '#EF4444' : '#22C55E'}
              avatar={<IconWell icon="door" color={colors.primary} size={38} />}
              title={`Room ${r.roomNumber}`}
              subtitle={`${occupied}/${r.capacity} occupied`}
              meta={[{ label: 'Students', value: (r.students ?? []).map((s) => s.name).join(', ') || 'None assigned' }]}
              expandable
              actions={
                <>
                  <Button mode="text" compact onPress={() => setSelectedRoom(r)}>
                    Manage
                  </Button>
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={colors.danger}
                    size={18}
                    disabled={deleteState.isLoading}
                    onPress={() => deleteRoom(r._id)}
                  />
                </>
              }
            />
          );
        })}
      </QueryState>

      <CreateRoomSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <RoomDetailSheet room={activeRoom} onDismiss={() => setSelectedRoom(null)} />
    </ScreenContainer>
  );
}

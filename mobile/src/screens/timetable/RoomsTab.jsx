import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { CreateTimetableRoomSheet } from './CreateTimetableRoomSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import { useDeleteTimetableRoomMutation, useGetTimetableRoomsQuery } from '../../store/api/apiSlice';

export function RoomsTab() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data: rooms = [], isLoading, isFetching, isError, error, refetch } = useGetTimetableRoomsQuery();
  const [deleteRoom, deleteState] = useDeleteTimetableRoomMutation();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Add Room
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={rooms.length === 0}
        emptyIcon="door"
        emptyLabel="No rooms defined yet"
      >
        {rooms.map((room) => (
          <AccentListCard
            key={room._id}
            accent={colors.primary}
            avatar={<IconWell icon="door" color={colors.primary} size={38} />}
            title={room.name}
            subtitle={`${room.type}${room.code ? ` · ${room.code}` : ''}${room.capacity ? ` · Capacity ${room.capacity}` : ''}`}
            actions={
              <IconButton
                icon="trash-can-outline"
                iconColor={colors.danger}
                size={18}
                disabled={deleteState.isLoading}
                onPress={() => confirmDelete(() => deleteRoom(room._id), 'this room')}
              />
            }
          />
        ))}
      </QueryState>

      <CreateTimetableRoomSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </View>
  );
}

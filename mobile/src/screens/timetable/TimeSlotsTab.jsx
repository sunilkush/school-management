import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { CreateTimeSlotSheet } from './CreateTimeSlotSheet';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import { useDeleteTimeSlotMutation, useGetTimeSlotsQuery } from '../../store/api/apiSlice';

export function TimeSlotsTab() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [creating, setCreating] = useState(false);

  const { data: timeSlots = [], isLoading, isFetching, isError, error, refetch } = useGetTimeSlotsQuery({ academicYearId }, { skip: !academicYearId });
  const [deleteTimeSlot, deleteState] = useDeleteTimeSlotMutation();

  return (
    <View>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
        Periods and breaks used to build the weekly schedule.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Add Time Slot
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={timeSlots.length === 0}
        emptyIcon="clock-outline"
        emptyLabel="No time slots defined yet"
      >
        {timeSlots.map((slot) => (
          <AccentListCard
            key={slot._id}
            accent={colors.primary}
            avatar={<IconWell icon="clock-outline" color={colors.primary} size={38} />}
            title={slot.name}
            subtitle={`${slot.startTime} – ${slot.endTime} · ${slot.type}`}
            actions={
              <IconButton
                icon="trash-can-outline"
                iconColor={colors.danger}
                size={18}
                disabled={deleteState.isLoading}
                onPress={() => confirmDelete(() => deleteTimeSlot(slot._id), 'this time slot')}
              />
            }
          />
        ))}
      </QueryState>

      <CreateTimeSlotSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        academicYearId={academicYearId}
        nextOrder={timeSlots.length}
      />
    </View>
  );
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { AssignTransportSheet } from './AssignTransportSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import { useDeleteTransportAssignmentMutation, useGetTransportAssignmentsQuery } from '../../store/api/apiSlice';

/** Assign a student to a transport route + vehicle — distinct from the Routes/Vehicles fleet
 * screens already built; mirrors frontend/src/pages/School_Admin/Transport/Assignments.jsx. */
export function TransportAssignmentsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [assigning, setAssigning] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTransportAssignmentsQuery();
  const assignments = data ?? [];
  const [deleteAssignment, deleteState] = useDeleteTransportAssignmentMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setAssigning(true)}>
          Assign Student
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={assignments.length === 0}
        emptyIcon="bus-school"
        emptyLabel="No transport assignments yet"
      >
        {assignments.map((a) => (
          <AccentListCard
            key={a._id}
            accent={colors.primary}
            avatar={<IconWell icon="bus-school" color={colors.primary} size={38} />}
            title={a.studentEnrollmentId?.studentId?.userId?.name ?? 'Unknown Student'}
            subtitle={`${a.studentEnrollmentId?.schoolClassId?.name ?? ''}${a.studentEnrollmentId?.sectionId?.name ? ` ${a.studentEnrollmentId.sectionId.name}` : ''}`}
            meta={[
              { label: 'Route', value: a.routeId?.name ?? '—' },
              { label: 'Vehicle', value: a.vehicleId?.busNumber ?? '—' },
              ...(a.pickupStop ? [{ label: 'Pickup', value: a.pickupStop }] : []),
              ...(a.dropStop ? [{ label: 'Drop', value: a.dropStop }] : []),
            ]}
            expandable
            actions={
              <IconButton
                icon="trash-can-outline"
                iconColor={colors.danger}
                size={18}
                disabled={deleteState.isLoading}
                onPress={() => confirmDelete(() => deleteAssignment(a._id), 'this assignment')}
              />
            }
          />
        ))}
      </QueryState>

      <AssignTransportSheet visible={assigning} onDismiss={() => setAssigning(false)} onCreated={() => setAssigning(false)} />
    </ScreenContainer>
  );
}

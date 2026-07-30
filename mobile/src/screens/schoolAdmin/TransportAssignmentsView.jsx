import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { AssignTransportSheet } from './AssignTransportSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import {
  useDeleteTransportAssignmentMutation,
  useGetAssignableTransportStudentsQuery,
  useGetTransportAssignmentsQuery,
  useGetTransportRoutesQuery,
  useGetVehiclesQuery,
} from '../../store/api/apiSlice';

/** Assign a student to a transport route + vehicle — distinct from the Routes/Vehicles fleet
 * screens already built; mirrors frontend/src/pages/School_Admin/Transport/Assignments.jsx. The
 * "assign" endpoint is actually an upsert keyed by studentEnrollmentId
 * (createOrUpdateTransportAssignment), so Edit reuses the exact same save call as Create, just
 * pre-filled — matching web's single Modal-for-both-modes pattern. */
export function TransportAssignmentsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTransportAssignmentsQuery();
  const assignments = data ?? [];
  const [deleteAssignment, deleteState] = useDeleteTransportAssignmentMutation();

  const studentsQuery = useGetAssignableTransportStudentsQuery();
  const routesQuery = useGetTransportRoutesQuery();
  const vehiclesQuery = useGetVehiclesQuery();

  const openCreate = () => {
    setEditingAssignment(null);
    setSheetVisible(true);
  };
  const openEdit = (a) => {
    setEditingAssignment({
      studentEnrollmentId: a.studentEnrollmentId?._id,
      routeId: a.routeId?._id,
      vehicleId: a.vehicleId?._id,
      pickupStop: a.pickupStop,
      dropStop: a.dropStop,
    });
    setSheetVisible(true);
  };
  const closeSheet = () => {
    setSheetVisible(false);
    setEditingAssignment(null);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="swap-horizontal" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Transport Assignments</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
            Assign routes and vehicles to students for daily commute
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total Assignments" metric={{ value: assignments.length, icon: 'swap-horizontal', color: colors.primary }} />
          <StatCard label="Students" metric={{ value: studentsQuery.data?.length ?? 0, icon: 'account-group-outline', color: '#14B8A6' }} />
          <StatCard label="Routes" metric={{ value: routesQuery.data?.length ?? 0, icon: 'map-marker-path', color: '#7C3AED' }} />
          <StatCard label="Vehicles" metric={{ value: vehiclesQuery.data?.length ?? 0, icon: 'bus-school', color: '#F97316' }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={openCreate}>
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
              <View style={{ flexDirection: 'row' }}>
                <IconButton icon="pencil-outline" iconColor={colors.primary} size={18} onPress={() => openEdit(a)} />
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={18}
                  disabled={deleteState.isLoading}
                  onPress={() => confirmDelete(() => deleteAssignment(a._id), 'this assignment')}
                />
              </View>
            }
          />
        ))}
      </QueryState>

      <AssignTransportSheet visible={sheetVisible} editing={editingAssignment} onDismiss={closeSheet} onCreated={closeSheet} />
    </ScreenContainer>
  );
}

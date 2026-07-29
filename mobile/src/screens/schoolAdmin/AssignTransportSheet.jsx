import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetAssignableTransportStudentsQuery,
  useGetTransportRoutesQuery,
  useGetVehiclesQuery,
  useSaveTransportAssignmentMutation,
} from '../../store/api/apiSlice';

export function AssignTransportSheet({ visible, onDismiss, onCreated, editing }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [saveAssignment, saveState] = useSaveTransportAssignmentMutation();

  const studentsQuery = useGetAssignableTransportStudentsQuery(undefined, { skip: !visible });
  const routesQuery = useGetTransportRoutesQuery(undefined, { skip: !visible });
  const vehiclesQuery = useGetVehiclesQuery(undefined, { skip: !visible });
  const students = studentsQuery.data ?? [];
  const routes = routesQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];

  const [studentEnrollmentId, setStudentEnrollmentId] = useState(null);
  const [routeId, setRouteId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [pickupStop, setPickupStop] = useState('');
  const [dropStop, setDropStop] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setStudentEnrollmentId(editing?.studentEnrollmentId ?? null);
      setRouteId(editing?.routeId ?? null);
      setVehicleId(editing?.vehicleId ?? null);
      setPickupStop(editing?.pickupStop ?? '');
      setDropStop(editing?.dropStop ?? '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = async () => {
    if (!studentEnrollmentId || !routeId || !vehicleId) {
      setError('Student, route and vehicle are all required');
      return;
    }
    try {
      await saveAssignment({
        studentEnrollmentId,
        routeId,
        vehicleId,
        pickupStop: pickupStop.trim() || undefined,
        dropStop: dropStop.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to save assignment');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            {editing ? 'Edit Assignment' : 'Assign Transport'}
          </Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STUDENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {students.map((s) => (
              <Chip key={s._id} selected={s._id === studentEnrollmentId} onPress={() => setStudentEnrollmentId(s._id)}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>ROUTE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {routes.map((r) => (
              <Chip key={r._id} selected={r._id === routeId} onPress={() => setRouteId(r._id)}>
                {r.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>VEHICLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {vehicles.map((v) => (
              <Chip key={v._id} selected={v._id === vehicleId} onPress={() => setVehicleId(v._id)}>
                {v.busNumber}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Pickup Stop (optional)" value={pickupStop} onChangeText={setPickupStop} style={{ marginTop: spacing.sm }} disabled={saveState.isLoading} />
          <FormField label="Drop Stop (optional)" value={dropStop} onChangeText={setDropStop} disabled={saveState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>
              {editing ? 'Update' : 'Save'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

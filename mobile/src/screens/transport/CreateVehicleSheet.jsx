import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateVehicleMutation, useUpdateVehicleMutation } from '../../store/api/apiSlice';

const VEHICLE_TYPES = ['Bus', 'Van', 'Car'];
const VEHICLE_STATUSES = ['Available', 'In Use', 'Maintenance'];

// The Transport model stores driver as a plain string, not a User reference — a driver picker
// pulling from GET /user/all (as the web app does) would add a call for no real data-model
// benefit here; a text field produces the exact same payload.
//
// Doubles as the edit sheet — pass `vehicle` to pre-fill the form and save via PUT instead of
// POST. The GET /transport/vehicles response uses DB field names (vehicleType/busNumber/
// driverName); create+update both accept the shorter type/number/driver names and map them
// server-side (backend/src/controllers/transport.controllers.js updateVehicle's fieldMap) — so
// prefill reads the DB names but the outgoing payload keeps the shorter create/update names.
export function CreateVehicleSheet({ visible, onDismiss, onCreated, vehicle }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createVehicle, createState] = useCreateVehicleMutation();
  const [updateVehicle, updateState] = useUpdateVehicleMutation();
  const isEditing = Boolean(vehicle);
  const saving = isEditing ? updateState.isLoading : createState.isLoading;

  const [type, setType] = useState('Bus');
  const [number, setNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('Available');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setType(vehicle?.vehicleType ?? 'Bus');
      setNumber(vehicle?.busNumber ?? '');
      setDriver(vehicle?.driverName ?? '');
      setDriverContact(vehicle?.driverContact ?? '');
      setCapacity(vehicle ? String(vehicle.capacity ?? '') : '');
      setStatus(vehicle?.status ?? 'Available');
      setError(null);
    }
  }, [visible, vehicle]);

  const handleSave = async () => {
    if (!number.trim() || !driver.trim()) {
      setError('Vehicle number and driver are required');
      return;
    }

    const payload = {
      type,
      number: number.trim(),
      driver: driver.trim(),
      driverContact: driverContact.trim() || undefined,
      capacity: Number(capacity) || 0,
      status,
    };

    try {
      if (isEditing) {
        await updateVehicle({ id: vehicle._id, ...payload }).unwrap();
      } else {
        await createVehicle(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save vehicle');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Vehicle' : 'New Vehicle'}</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {VEHICLE_TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </View>

          <FormField label="Vehicle Number" value={number} onChangeText={setNumber} disabled={saving} />
          <FormField label="Driver Name" value={driver} onChangeText={setDriver} disabled={saving} />
          <FormField label="Driver Contact" value={driverContact} onChangeText={setDriverContact} keyboardType="phone-pad" disabled={saving} />
          <FormField label="Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" disabled={saving} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STATUS</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {VEHICLE_STATUSES.map((s) => (
              <Chip key={s} selected={s === status} onPress={() => setStatus(s)}>
                {s}
              </Chip>
            ))}
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

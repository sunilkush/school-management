import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateVehicleMutation } from '../../store/api/apiSlice';

const VEHICLE_TYPES = ['Bus', 'Van', 'Car'];
const VEHICLE_STATUSES = ['Available', 'In Use', 'Maintenance'];

// The Transport model stores driver as a plain string, not a User reference — a driver picker
// pulling from GET /user/all (as the web app does) would add a call for no real data-model
// benefit here; a text field produces the exact same payload.
export function CreateVehicleSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createVehicle, createState] = useCreateVehicleMutation();

  const [type, setType] = useState('Bus');
  const [number, setNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('Available');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setType('Bus');
      setNumber('');
      setDriver('');
      setDriverContact('');
      setCapacity('');
      setStatus('Available');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!number.trim() || !driver.trim()) {
      setError('Vehicle number and driver are required');
      return;
    }

    try {
      await createVehicle({
        type,
        number: number.trim(),
        driver: driver.trim(),
        driverContact: driverContact.trim() || undefined,
        capacity: Number(capacity) || 0,
        status,
      }).unwrap();
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
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Vehicle</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {VEHICLE_TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </View>

          <FormField label="Vehicle Number" value={number} onChangeText={setNumber} disabled={createState.isLoading} />
          <FormField label="Driver Name" value={driver} onChangeText={setDriver} disabled={createState.isLoading} />
          <FormField label="Driver Contact" value={driverContact} onChangeText={setDriverContact} keyboardType="phone-pad" disabled={createState.isLoading} />
          <FormField label="Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" disabled={createState.isLoading} />

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
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

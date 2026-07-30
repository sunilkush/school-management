import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateMaintenanceRecordMutation, useGetVehiclesQuery } from '../../store/api/apiSlice';

const SERVICE_TYPES = ['Oil Change', 'Tyre Replacement', 'Engine Check', 'Brake Service', 'AC Service', 'Other'];

export function CreateMaintenanceSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRecord, createState] = useCreateMaintenanceRecordMutation();
  const vehiclesQuery = useGetVehiclesQuery(undefined, { skip: !visible });
  const vehicles = vehiclesQuery.data ?? [];

  const [vehicleId, setVehicleId] = useState(null);
  const [serviceType, setServiceType] = useState('Oil Change');
  const [scheduledDate, setScheduledDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setVehicleId(null);
      setServiceType('Oil Change');
      setScheduledDate('');
      setEstimatedCost('');
      setNotes('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!scheduledDate.trim()) {
      setError('Scheduled date is required');
      return;
    }
    const vehicle = vehicles.find((v) => v._id === vehicleId);
    try {
      await createRecord({
        vehicleId: vehicleId || undefined,
        vehicleNo: vehicle?.busNumber,
        vehicleName: vehicle?.busNumber,
        serviceType,
        scheduledDate: scheduledDate.trim(),
        estimatedCost: Number(estimatedCost) || 0,
        notes: notes.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to schedule maintenance');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Schedule Maintenance</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>VEHICLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {vehicles.map((v) => (
              <Chip key={v._id} selected={v._id === vehicleId} onPress={() => setVehicleId(v._id)}>
                {v.busNumber}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SERVICE TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {SERVICE_TYPES.map((t) => (
              <Chip key={t} selected={t === serviceType} onPress={() => setServiceType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Scheduled Date (YYYY-MM-DD)" value={scheduledDate} onChangeText={setScheduledDate} disabled={createState.isLoading} />
          <FormField label="Estimated Cost" value={estimatedCost} onChangeText={setEstimatedCost} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={2} disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Schedule
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

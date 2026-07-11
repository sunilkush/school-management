import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { TIME_SLOT_TYPES } from '../../utils/timetable';
import { useCreateTimeSlotMutation } from '../../store/api/apiSlice';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function CreateTimeSlotSheet({ visible, onDismiss, onCreated, academicYearId, nextOrder }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createTimeSlot, createState] = useCreateTimeSlotMutation();

  const [name, setName] = useState('');
  const [type, setType] = useState('period');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setType('period');
      setStartTime('');
      setEndTime('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim() || !TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setError('Name and valid start/end times (HH:MM, 24-hour) are required');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }
    try {
      await createTimeSlot({ academicYearId, name: name.trim(), type, startTime, endTime, order: nextOrder }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save time slot');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Time Slot</Text>

        <FormField label="Name (e.g. Period 1)" value={name} onChangeText={setName} disabled={createState.isLoading} />

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
          {TIME_SLOT_TYPES.map((t) => (
            <Chip key={t} selected={t === type} onPress={() => setType(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </Chip>
          ))}
        </View>

        <FormField label="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} disabled={createState.isLoading} />
        <FormField label="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} disabled={createState.isLoading} />

        {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

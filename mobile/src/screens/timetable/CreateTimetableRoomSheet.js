import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { ROOM_TYPES } from '../../utils/timetable';
import { useCreateTimetableRoomMutation } from '../../store/api/apiSlice';

export function CreateTimetableRoomSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRoom, createState] = useCreateTimetableRoomMutation();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState('');
  const [type, setType] = useState('classroom');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setCode('');
      setCapacity('');
      setType('classroom');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    try {
      await createRoom({ name: name.trim(), code: code.trim(), capacity: Number(capacity) || 0, type }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save room');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Room</Text>

        <FormField label="Room Name" value={name} onChangeText={setName} disabled={createState.isLoading} />
        <FormField label="Code (optional)" value={code} onChangeText={setCode} disabled={createState.isLoading} />
        <FormField label="Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" disabled={createState.isLoading} />

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {ROOM_TYPES.map((t) => (
            <Chip key={t} selected={t === type} onPress={() => setType(t)}>
              {t[0].toUpperCase() + t.slice(1)}
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
      </Modal>
    </Portal>
  );
}

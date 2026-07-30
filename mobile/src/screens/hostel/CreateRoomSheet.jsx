import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateHostelRoomMutation } from '../../store/api/apiSlice';

export function CreateRoomSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRoom, createState] = useCreateHostelRoomMutation();

  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setRoomNumber('');
      setCapacity('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!roomNumber.trim() || !capacity.trim()) {
      setError('Room number and capacity are required');
      return;
    }

    try {
      await createRoom({ roomNumber: roomNumber.trim(), capacity: Number(capacity) }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save room');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Room</Text>

        <FormField label="Room Number" value={roomNumber} onChangeText={setRoomNumber} disabled={createState.isLoading} />
        <FormField label="Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" disabled={createState.isLoading} />

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

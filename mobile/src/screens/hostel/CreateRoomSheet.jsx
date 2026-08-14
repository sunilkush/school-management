import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateHostelRoomMutation, useUpdateHostelRoomMutation } from '../../store/api/apiSlice';

/** Doubles as the edit sheet — pass `room` to pre-fill the form and save via PUT instead of POST. */
export function CreateRoomSheet({ visible, onDismiss, onCreated, room }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRoom, createState] = useCreateHostelRoomMutation();
  const [updateRoom, updateState] = useUpdateHostelRoomMutation();
  const isEditing = Boolean(room);
  const saving = isEditing ? updateState.isLoading : createState.isLoading;

  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setRoomNumber(room?.roomNumber ?? '');
      setCapacity(room ? String(room.capacity ?? '') : '');
      setError(null);
    }
  }, [visible, room]);

  const handleSave = async () => {
    if (!roomNumber.trim() || !capacity.trim()) {
      setError('Room number and capacity are required');
      return;
    }

    try {
      if (isEditing) {
        await updateRoom({ id: room._id, roomNumber: roomNumber.trim(), capacity: Number(capacity) }).unwrap();
      } else {
        await createRoom({ roomNumber: roomNumber.trim(), capacity: Number(capacity) }).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save room');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Room' : 'New Room'}</Text>

        <FormField label="Room Number" value={roomNumber} onChangeText={setRoomNumber} disabled={saving} />
        <FormField label="Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" disabled={saving} />

        {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

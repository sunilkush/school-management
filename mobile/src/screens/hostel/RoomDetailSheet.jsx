import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAssignStudentToRoomMutation, useRemoveStudentFromRoomMutation } from '../../store/api/apiSlice';

/** Assign/unassign students to a room — `students` is a plain {_id, name} subdocument, not a real
 * Student reference (see apiSlice.js), so this is just a name field, not a student search. */
export function RoomDetailSheet({ room, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState(null);
  const [assignStudent, assignState] = useAssignStudentToRoomMutation();
  const [removeStudent, removeState] = useRemoveStudentFromRoomMutation();

  const handleAssign = async () => {
    if (!studentName.trim()) {
      setError('Enter a student name');
      return;
    }
    try {
      await assignStudent({ roomId: room._id, studentName: studentName.trim() }).unwrap();
      setStudentName('');
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to assign student');
    }
  };

  const isFull = room && room.students.length >= room.capacity;

  return (
    <Portal>
      <Modal visible={Boolean(room)} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        {room && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>Room {room.roomNumber}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
              {room.students.length}/{room.capacity} occupied
            </Text>

            {room.students.map((s) => (
              <View key={s._id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                <Text style={[typography.body, { color: colors.text }]}>{s.name}</Text>
                <IconButton
                  icon="close"
                  size={16}
                  disabled={removeState.isLoading}
                  onPress={() => removeStudent({ roomId: room._id, studentId: s._id })}
                />
              </View>
            ))}

            {!isFull && (
              <View style={{ marginTop: spacing.md }}>
                <FormField label="Student Name" value={studentName} onChangeText={setStudentName} disabled={assignState.isLoading} />
                <Button mode="contained" onPress={handleAssign} loading={assignState.isLoading} disabled={assignState.isLoading}>
                  Assign
                </Button>
              </View>
            )}
            {isFull && <Text style={[typography.caption, { color: colors.warning, marginTop: spacing.sm }]}>Room is full</Text>}

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <Button mode="outlined" onPress={onDismiss} style={{ marginTop: spacing.lg }}>
              Close
            </Button>
          </ScrollView>
        )}
      </Modal>
    </Portal>
  );
}

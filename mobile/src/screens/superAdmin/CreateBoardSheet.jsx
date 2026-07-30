import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateBoardMutation, useUpdateBoardMutation } from '../../store/api/apiSlice';

export function CreateBoardSheet({ visible, onDismiss, onCreated, board }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { role } = useAuth();
  const [createBoard, createState] = useCreateBoardMutation();
  const [updateBoard, updateState] = useUpdateBoardMutation();
  const isEditing = Boolean(board);
  const saveState = isEditing ? updateState : createState;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(board?.name ?? '');
      setCode(board?.code ?? '');
      setDescription(board?.description ?? '');
      setError(null);
    }
  }, [visible, board]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }
    try {
      if (isEditing) {
        await updateBoard({ id: board._id, name: name.trim(), code: code.trim() || undefined, description: description.trim() || undefined }).unwrap();
      } else {
        await createBoard({ name: name.trim(), code: code.trim() || undefined, description: description.trim() || undefined, createdByRole: role?.name }).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to save board');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Board' : 'New Board'}</Text>

          <FormField label="Name" value={name} onChangeText={setName} disabled={saveState.isLoading} />
          <FormField label="Code (optional)" value={code} onChangeText={setCode} autoCapitalize="characters" disabled={saveState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={saveState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

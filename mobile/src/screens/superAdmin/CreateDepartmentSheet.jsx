import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from '../../store/api/apiSlice';

export function CreateDepartmentSheet({ visible, onDismiss, onCreated, department }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createDepartment, createState] = useCreateDepartmentMutation();
  const [updateDepartment, updateState] = useUpdateDepartmentMutation();
  const isEditing = Boolean(department);
  const saveState = isEditing ? updateState : createState;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [head, setHead] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(department?.name ?? '');
      setCode(department?.code ?? '');
      setHead(department?.head ?? '');
      setDescription(department?.description ?? '');
      setError(null);
    }
  }, [visible, department]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Department name is required');
      return;
    }
    const payload = { name: name.trim(), code: code.trim() || undefined, head: head.trim() || undefined, description: description.trim() || undefined };
    try {
      if (isEditing) {
        await updateDepartment({ id: department._id, ...payload }).unwrap();
      } else {
        await createDepartment(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to save department');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Department' : 'New Department'}</Text>

          <FormField label="Name" value={name} onChangeText={setName} disabled={saveState.isLoading} />
          <FormField label="Code (optional)" value={code} onChangeText={setCode} autoCapitalize="characters" disabled={saveState.isLoading} />
          <FormField label="Head (optional)" value={head} onChangeText={setHead} disabled={saveState.isLoading} />
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

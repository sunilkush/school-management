import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateDesignationMutation, useGetDepartmentsQuery, useUpdateDesignationMutation } from '../../store/api/apiSlice';

const LEVELS = ['Senior', 'Mid', 'Junior'];

export function CreateDesignationSheet({ visible, onDismiss, onCreated, designation }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createDesignation, createState] = useCreateDesignationMutation();
  const [updateDesignation, updateState] = useUpdateDesignationMutation();
  const isEditing = Boolean(designation);
  const saveState = isEditing ? updateState : createState;
  const departmentsQuery = useGetDepartmentsQuery(undefined, { skip: !visible });
  const departments = departmentsQuery.data ?? [];

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('Mid');
  const [departmentId, setDepartmentId] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle(designation?.title ?? '');
      setLevel(designation?.level ?? 'Mid');
      setDepartmentId(designation?.departmentId?._id ?? designation?.departmentId ?? null);
      setDescription(designation?.description ?? '');
      setError(null);
    }
  }, [visible, designation]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Designation title is required');
      return;
    }
    const payload = { title: title.trim(), level, departmentId: departmentId || undefined, description: description.trim() || undefined };
    try {
      if (isEditing) {
        await updateDesignation({ id: designation._id, ...payload }).unwrap();
      } else {
        await createDesignation(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to save designation');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Designation' : 'New Designation'}</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={saveState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={saveState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>LEVEL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {LEVELS.map((l) => (
              <Chip key={l} selected={l === level} onPress={() => setLevel(l)}>
                {l}
              </Chip>
            ))}
          </ScrollView>

          {departments.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>DEPARTMENT (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {departments.map((d) => (
                  <Chip key={d._id} selected={d._id === departmentId} onPress={() => setDepartmentId(d._id === departmentId ? null : d._id)}>
                    {d.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

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

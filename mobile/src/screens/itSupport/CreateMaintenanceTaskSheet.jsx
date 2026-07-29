import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateMaintenanceTaskMutation } from '../../store/api/apiSlice';

const PRIORITIES = ['low', 'medium', 'high'];

export function CreateMaintenanceTaskSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createTask, createState] = useCreateMaintenanceTaskMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create task');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Maintenance Task</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>PRIORITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {PRIORITIES.map((p) => (
              <Chip key={p} selected={p === priority} onPress={() => setPriority(p)}>
                {p}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Due Date (YYYY-MM-DD, optional)" value={dueDate} onChangeText={setDueDate} disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Create
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

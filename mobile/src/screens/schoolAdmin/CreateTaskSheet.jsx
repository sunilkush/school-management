import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateTaskMutation, useGetAssignableUsersQuery } from '../../store/api/apiSlice';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function CreateTaskSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createTask, createState] = useCreateTaskMutation();
  const usersQuery = useGetAssignableUsersQuery(undefined, { skip: !visible });
  const users = usersQuery.data ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignedTo([]);
      setError(null);
    }
  }, [visible]);

  const toggleUser = (id) => {
    setAssignedTo((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate.trim() || undefined,
        assignedTo,
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
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Task</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={createState.isLoading} />
          <FormField label="Due Date (YYYY-MM-DD, optional)" value={dueDate} onChangeText={setDueDate} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>PRIORITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {PRIORITIES.map((p) => (
              <Chip key={p} selected={p === priority} onPress={() => setPriority(p)}>
                {p}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>
            ASSIGN TO ({assignedTo.length} selected)
          </Text>
          {usersQuery.isLoading ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>Loading users…</Text>
          ) : (
            <View style={{ gap: spacing.xs }}>
              {users.map((u) => (
                <Pressable
                  key={u._id}
                  onPress={() => toggleUser(u._id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.sm,
                    borderRadius: radii.md,
                    backgroundColor: assignedTo.includes(u._id) ? colors.surfaceSoft : 'transparent',
                  }}
                >
                  <AvatarInitials name={u.name} size={30} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text }]}>{u.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{u.role}</Text>
                  </View>
                  {assignedTo.includes(u._id) && <Text style={{ color: colors.primary }}>✓</Text>}
                </Pressable>
              ))}
            </View>
          )}

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

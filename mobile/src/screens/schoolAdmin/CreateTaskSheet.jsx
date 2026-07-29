import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateTaskMutation, useGetAssignableUsersQuery, useUpdateTaskMutation } from '../../store/api/apiSlice';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Create AND edit — mirrors web's TaskManagement.jsx modal, which both create and edit share
 * (including a direct Status picker rather than mobile's old "Advance" button that silently cycled
 * status forward, wrapping cancelled back to todo — confusing, and not how web lets you change
 * status at all: web always sets status explicitly via this same dropdown). */
export function CreateTaskSheet({ visible, onDismiss, onCreated, editing }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createTask, createState] = useCreateTaskMutation();
  const [updateTask, updateState] = useUpdateTaskMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const usersQuery = useGetAssignableUsersQuery(undefined, { skip: !visible });
  const users = usersQuery.data ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title ?? '');
      setDescription(editing.description ?? '');
      setPriority(editing.priority || 'medium');
      setStatus(editing.status || 'todo');
      setDueDate(editing.dueDate ? editing.dueDate.slice(0, 10) : '');
      setAssignedTo((editing.assignedTo ?? []).map((u) => u._id ?? u));
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setAssignedTo([]);
    }
    setError(null);
  }, [visible, editing]);

  const toggleUser = (id) => {
    setAssignedTo((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate.trim() || undefined,
      assignedTo,
    };
    try {
      if (editing) {
        await updateTask({ id: editing._id, ...payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || `Failed to ${editing ? 'update' : 'create'} task`);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            {editing ? 'Edit Task' : 'New Task'}
          </Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={saving} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={saving} />
          <FormField label="Due Date (YYYY-MM-DD, optional)" value={dueDate} onChangeText={setDueDate} disabled={saving} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>PRIORITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {PRIORITIES.map((p) => (
              <Chip key={p.value} selected={p.value === priority} onPress={() => setPriority(p.value)}>
                {p.label}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {STATUSES.map((s) => (
              <Chip key={s.value} selected={s.value === status} onPress={() => setStatus(s.value)}>
                {s.label}
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
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

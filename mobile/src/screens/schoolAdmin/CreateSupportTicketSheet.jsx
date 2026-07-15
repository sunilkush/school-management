import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateSupportTicketMutation } from '../../store/api/apiSlice';

const CATEGORIES = ['General', 'Technical', 'Academic', 'Finance', 'Transport', 'Hostel', 'Library', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export function CreateSupportTicketSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createTicket, createState] = useCreateSupportTicketMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setCategory('General');
      setPriority('Medium');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are both required');
      return;
    }
    try {
      await createTicket({ title: title.trim(), description: description.trim(), category, priority }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create ticket');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Support Ticket</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>PRIORITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {PRIORITIES.map((p) => (
              <Chip key={p} selected={p === priority} onPress={() => setPriority(p)}>
                {p}
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Submit
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

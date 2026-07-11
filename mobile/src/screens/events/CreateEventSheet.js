import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { EVENT_AUDIENCES, EVENT_TYPES } from '../../utils/events';
import { useCreateEventMutation } from '../../store/api/apiSlice';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function CreateEventSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createEvent, createState] = useCreateEventMutation();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Event');
  const [audience, setAudience] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setType('Event');
      setAudience('All');
      setStartDate('');
      setEndDate('');
      setLocation('');
      setDescription('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim() || !DATE_PATTERN.test(startDate)) {
      setError('Title and a valid start date (YYYY-MM-DD) are required');
      return;
    }
    try {
      await createEvent({
        title: title.trim(),
        type,
        audience,
        startDate,
        endDate: DATE_PATTERN.test(endDate) ? endDate : startDate,
        location: location.trim(),
        description: description.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save event');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Event</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
            {EVENT_TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>AUDIENCE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
            {EVENT_AUDIENCES.map((a) => (
              <Chip key={a} selected={a === audience} onPress={() => setAudience(a)}>
                {a}
              </Chip>
            ))}
          </View>

          <FormField label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} disabled={createState.isLoading} />
          <FormField label="End Date (optional, YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} disabled={createState.isLoading} />
          <FormField label="Location (optional)" value={location} onChangeText={setLocation} disabled={createState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

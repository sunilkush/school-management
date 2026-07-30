import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateSportsEventMutation, useGetSportsTeamsQuery } from '../../store/api/apiSlice';

const EVENT_TYPES = ['Match', 'Tournament', 'Competition', 'Practice'];

export function CreateSportsEventSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const teamsQuery = useGetSportsTeamsQuery(undefined, { skip: !visible });
  const teams = teamsQuery.data ?? [];
  const [createEvent, createState] = useCreateSportsEventMutation();

  const [teamId, setTeamId] = useState(null);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Match');
  const [opponent, setOpponent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTeamId(null); setTitle(''); setEventType('Match'); setOpponent('');
      setEventDate(''); setVenue(''); setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim()) { setError('Enter a title'); return; }
    try {
      await createEvent({
        title: title.trim(),
        teamId: teamId || undefined,
        eventType,
        opponent: opponent.trim(),
        eventDate: eventDate || undefined,
        venue: venue.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create event');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Sports Event</Text>

          {teams.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TEAM (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' }}>
                {teams.map((t) => (
                  <Chip key={t._id} selected={t._id === teamId} onPress={() => setTeamId(t._id === teamId ? null : t._id)}>{t.name}</Chip>
                ))}
              </ScrollView>
            </>
          )}

          <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" style={{ marginBottom: spacing.sm }} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
            {EVENT_TYPES.map((t) => <Chip key={t} selected={t === eventType} onPress={() => setEventType(t)}>{t}</Chip>)}
          </View>

          <TextInput label="Opponent (optional)" value={opponent} onChangeText={setOpponent} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Date (YYYY-MM-DD)" value={eventDate} onChangeText={setEventDate} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Venue (optional)" value={venue} onChangeText={setVenue} mode="outlined" style={{ marginBottom: spacing.md }} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>Create</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

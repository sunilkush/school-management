import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateSportsTeamMutation } from '../../store/api/apiSlice';

const CATEGORIES = ['Sport', 'Cultural', 'Club', 'Other'];

export function CreateTeamSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createTeam, createState] = useCreateSportsTeamMutation();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sport');
  const [sportType, setSportType] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) { setName(''); setCategory('Sport'); setSportType(''); setError(null); }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Enter a team name'); return; }
    try {
      await createTeam({ name: name.trim(), category, sportType: sportType.trim() }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create team');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Team</Text>

          <TextInput label="Team name" value={name} onChangeText={setName} mode="outlined" style={{ marginBottom: spacing.sm }} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
            {CATEGORIES.map((c) => <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>{c}</Chip>)}
          </View>

          <TextInput label="Sport type (e.g. Football, Chess)" value={sportType} onChangeText={setSportType} mode="outlined" style={{ marginBottom: spacing.md }} />

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

import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateFeeHeadMutation } from '../../store/api/apiSlice';

// Matches feeHead.model.js's `name` enum exactly — it's a fixed list server-side, not free text.
const FEE_HEAD_NAMES = [
  'Admission Fee', 'Tuition Fee', 'Registration Fee', 'Transport Fee', 'Exam Fee',
  'Library Fee', 'Computer Fee', 'Hostel Fee', 'Mess Fee', 'Sports Fee',
  'Books Fee', 'Uniform Fee', 'Fine', 'Late Fee Fine',
];
const FEE_TYPES = ['recurring', 'one-time', 'penalty'];

export function CreateFeeHeadSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createFeeHead, createState] = useCreateFeeHeadMutation();

  const [name, setName] = useState(null);
  const [type, setType] = useState('recurring');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(null);
      setType('recurring');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name) {
      setError('Select a fee category');
      return;
    }
    try {
      await createFeeHead({ name, type }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create fee category');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Fee Category</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            {FEE_HEAD_NAMES.map((n) => (
              <Chip key={n} selected={n === name} onPress={() => setName(n)}>{n}</Chip>
            ))}
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {FEE_TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>{t}</Chip>
            ))}
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
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

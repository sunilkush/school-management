import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateCallLogMutation } from '../../store/api/apiSlice';

const TYPES = ['Incoming', 'Outgoing', 'Missed'];

export function CreateCallLogSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createLog, createState] = useCreateCallLogMutation();

  const [callerName, setCallerName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('Incoming');
  const [duration, setDuration] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setCallerName('');
      setPhone('');
      setType('Incoming');
      setDuration('');
      setPurpose('');
      setNotes('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!callerName.trim()) {
      setError('Caller name is required');
      return;
    }
    try {
      await createLog({
        callerName: callerName.trim(),
        phone: phone.trim() || undefined,
        type,
        duration: Number(duration) || undefined,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to log call');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Log Call</Text>

          <FormField label="Caller Name" value={callerName} onChangeText={setCallerName} disabled={createState.isLoading} />
          <FormField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" disabled={createState.isLoading} />
          <FormField label="Duration (minutes, optional)" value={duration} onChangeText={setDuration} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Purpose (optional)" value={purpose} onChangeText={setPurpose} disabled={createState.isLoading} />
          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={2} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Log Call
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

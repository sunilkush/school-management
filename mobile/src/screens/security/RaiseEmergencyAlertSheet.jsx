import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useRaiseEmergencyAlertMutation } from '../../store/api/apiSlice';

const TYPES = ['Fire', 'Medical Emergency', 'Security Breach', 'Natural Disaster', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High'];

export function RaiseEmergencyAlertSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [raiseAlert, raiseState] = useRaiseEmergencyAlertMutation();

  const [type, setType] = useState('Other');
  const [severity, setSeverity] = useState('Medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setType('Other');
      setSeverity('Medium');
      setLocation('');
      setDescription('');
      setError(null);
    }
  }, [visible]);

  const handleRaise = async () => {
    try {
      await raiseAlert({
        type,
        severity,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to raise alert');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Raise Emergency Alert</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SEVERITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {SEVERITIES.map((s) => (
              <Chip key={s} selected={s === severity} onPress={() => setSeverity(s)}>
                {s}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Location (optional)" value={location} onChangeText={setLocation} disabled={raiseState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={raiseState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={raiseState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" buttonColor={colors.danger} onPress={handleRaise} loading={raiseState.isLoading} disabled={raiseState.isLoading} style={{ flex: 1 }}>
              Raise Alert
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateGateEntryMutation } from '../../store/api/apiSlice';

const TYPES = ['Visitor', 'Parent', 'Vendor', 'Contractor', 'Staff', 'Student', 'Other'];
const GATES = ['Main', 'Side', 'Back', 'Other'];

export function CreateGateEntrySheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createEntry, createState] = useCreateGateEntryMutation();

  const [name, setName] = useState('');
  const [type, setType] = useState('Visitor');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [gate, setGate] = useState('Main');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setType('Visitor');
      setPhone('');
      setPurpose('');
      setVehicleNo('');
      setGate('Main');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await createEntry({
        name: name.trim(),
        type,
        phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        vehicleNo: vehicleNo.trim() || undefined,
        gate,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to log entry');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Gate Entry</Text>

          <FormField label="Name" value={name} onChangeText={setName} disabled={createState.isLoading} />
          <FormField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" disabled={createState.isLoading} />
          <FormField label="Purpose (optional)" value={purpose} onChangeText={setPurpose} disabled={createState.isLoading} />
          <FormField label="Vehicle No. (optional)" value={vehicleNo} onChangeText={setVehicleNo} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>GATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {GATES.map((g) => (
              <Chip key={g} selected={g === gate} onPress={() => setGate(g)}>
                {g}
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Log Entry
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

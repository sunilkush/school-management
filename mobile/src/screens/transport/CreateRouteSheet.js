import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateTransportRouteMutation } from '../../store/api/apiSlice';

export function CreateRouteSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRoute, createState] = useCreateTransportRouteMutation();

  const [name, setName] = useState('');
  const [bus, setBus] = useState('');
  const [stops, setStops] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setBus('');
      setStops('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim() || !bus.trim()) {
      setError('Route name and bus are required');
      return;
    }

    try {
      await createRoute({
        name: name.trim(),
        bus: bus.trim(),
        stops: stops.split(',').map((s) => s.trim()).filter(Boolean),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save route');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Route</Text>

          <FormField label="Route Name" value={name} onChangeText={setName} disabled={createState.isLoading} />
          <FormField label="Bus" value={bus} onChangeText={setBus} disabled={createState.isLoading} />
          <FormField label="Stops (comma separated)" value={stops} onChangeText={setStops} multiline numberOfLines={2} disabled={createState.isLoading} />

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

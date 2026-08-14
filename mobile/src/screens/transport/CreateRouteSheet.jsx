import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateTransportRouteMutation, useUpdateTransportRouteMutation } from '../../store/api/apiSlice';

/** Doubles as the edit sheet — pass `route` to pre-fill the form and save via PUT instead of POST. */
export function CreateRouteSheet({ visible, onDismiss, onCreated, route }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRoute, createState] = useCreateTransportRouteMutation();
  const [updateRoute, updateState] = useUpdateTransportRouteMutation();
  const isEditing = Boolean(route);
  const saving = isEditing ? updateState.isLoading : createState.isLoading;

  const [name, setName] = useState('');
  const [bus, setBus] = useState('');
  const [stops, setStops] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(route?.name ?? '');
      setBus(route?.bus ?? '');
      setStops((route?.stops ?? []).join(', '));
      setError(null);
    }
  }, [visible, route]);

  const handleSave = async () => {
    if (!name.trim() || !bus.trim()) {
      setError('Route name and bus are required');
      return;
    }

    const payload = {
      name: name.trim(),
      bus: bus.trim(),
      stops: stops.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (isEditing) {
        await updateRoute({ id: route._id, ...payload }).unwrap();
      } else {
        await createRoute(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save route');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Route' : 'New Route'}</Text>

          <FormField label="Route Name" value={name} onChangeText={setName} disabled={saving} />
          <FormField label="Bus" value={bus} onChangeText={setBus} disabled={saving} />
          <FormField label="Stops (comma separated)" value={stops} onChangeText={setStops} multiline numberOfLines={2} disabled={saving} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

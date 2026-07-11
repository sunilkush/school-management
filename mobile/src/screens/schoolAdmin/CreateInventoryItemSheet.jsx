import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateInventoryItemMutation } from '../../store/api/apiSlice';

const ITEM_TYPES = ['supply', 'asset'];

export function CreateInventoryItemSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createItem, createState] = useCreateInventoryItemMutation();

  const [itemType, setItemType] = useState('supply');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setItemType('supply');
      setName('');
      setCategory('');
      setQuantity('');
      setUnit('');
      setLocation('');
      setMinThreshold('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    try {
      await createItem({
        itemType,
        name: name.trim(),
        category: category.trim() || undefined,
        unit: unit.trim() || undefined,
        location: location.trim() || undefined,
        quantity: quantity.trim() || undefined,
        minThreshold: minThreshold.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create item');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Inventory Item</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {ITEM_TYPES.map((t) => (
              <Chip key={t} selected={t === itemType} onPress={() => setItemType(t)}>{t}</Chip>
            ))}
          </View>

          <FormField label="Name" value={name} onChangeText={setName} disabled={createState.isLoading} />
          <FormField label="Category" value={category} onChangeText={setCategory} disabled={createState.isLoading} />
          <FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Unit (e.g. pcs, reams)" value={unit} onChangeText={setUnit} disabled={createState.isLoading} />
          <FormField label="Location" value={location} onChangeText={setLocation} disabled={createState.isLoading} />
          <FormField label="Low Stock Threshold" value={minThreshold} onChangeText={setMinThreshold} keyboardType="numeric" disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
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

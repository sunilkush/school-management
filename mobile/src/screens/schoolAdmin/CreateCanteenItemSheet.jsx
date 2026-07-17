import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateCanteenItemMutation } from '../../store/api/apiSlice';

const CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Other'];

export function CreateCanteenItemSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createItem, createState] = useCreateCanteenItemMutation();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [price, setPrice] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) { setName(''); setCategory('Snacks'); setPrice(''); setError(null); }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Enter an item name'); return; }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) { setError('Enter a valid price'); return; }
    try {
      await createItem({ name: name.trim(), category, price: numericPrice }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to create item');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Menu Item</Text>

          <TextInput label="Item name" value={name} onChangeText={setName} mode="outlined" style={{ marginBottom: spacing.sm }} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
            {CATEGORIES.map((c) => <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>{c}</Chip>)}
          </View>

          <TextInput label="Price (₹)" value={price} onChangeText={setPrice} mode="outlined" keyboardType="decimal-pad" style={{ marginBottom: spacing.md }} />

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

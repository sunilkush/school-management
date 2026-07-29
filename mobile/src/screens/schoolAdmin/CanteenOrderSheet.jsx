import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StudentPicker } from '../../components/ui/StudentPicker';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetCanteenItemsQuery, useCreateCanteenOrderMutation } from '../../store/api/apiSlice';

export function CanteenOrderSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [basket, setBasket] = useState({});
  const [error, setError] = useState(null);

  const itemsQuery = useGetCanteenItemsQuery({ isAvailable: true }, { skip: !visible });
  const items = itemsQuery.data ?? [];
  const [createOrder, createState] = useCreateCanteenOrderMutation();

  useEffect(() => {
    if (visible) { setStudentId(null); setStudentName(''); setBasket({}); setError(null); }
  }, [visible]);

  const adjustQty = (itemId, delta) => {
    setBasket((b) => {
      const next = Math.max(0, (b[itemId] || 0) + delta);
      const updated = { ...b, [itemId]: next };
      if (next === 0) delete updated[itemId];
      return updated;
    });
  };

  const basketEntries = Object.entries(basket);
  const total = basketEntries.reduce((sum, [itemId, qty]) => {
    const item = items.find((i) => i._id === itemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleCreate = async () => {
    if (!studentId) { setError('Select a student'); return; }
    if (basketEntries.length === 0) { setError('Add at least one item'); return; }
    try {
      await createOrder({
        studentId,
        items: basketEntries.map(([itemId, quantity]) => ({ itemId, quantity })),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to place order');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Canteen Order</Text>

          <StudentPicker
            enabled={visible}
            selectedId={studentId}
            selectedName={studentName}
            onSelect={(id, name) => { setStudentId(id); setStudentName(name); }}
            onClear={() => setStudentId(null)}
          />

          {studentId && (
            <QueryState
              isLoading={itemsQuery.isLoading}
              isError={itemsQuery.isError}
              error={itemsQuery.error}
              onRetry={itemsQuery.refetch}
              isEmpty={items.length === 0}
              emptyIcon="food-outline"
              emptyLabel="No menu items available"
            >
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ITEMS</Text>
              {items.map((item) => (
                <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>₹{item.price}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton icon="minus" size={18} onPress={() => adjustQty(item._id, -1)} disabled={!basket[item._id]} />
                    <Text style={[typography.bodyStrong, { color: colors.text, minWidth: 20, textAlign: 'center' }]}>{basket[item._id] || 0}</Text>
                    <IconButton icon="plus" size={18} onPress={() => adjustQty(item._id, 1)} />
                  </View>
                </View>
              ))}

              <View style={{ marginTop: spacing.sm, marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>Total</Text>
                <Text style={[typography.bodyStrong, { color: colors.primary }]}>₹{total}</Text>
              </View>
            </QueryState>
          )}

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading || !studentId} style={{ flex: 1 }}>
              Place Order
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

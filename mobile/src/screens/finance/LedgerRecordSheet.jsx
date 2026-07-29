import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { PAYMENT_MODES, paymentModeLabel } from '../../utils/finance';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Shared create form for Income and Expense records — identical shape (title/category/amount/
 * date/paymentMode/reference/description) plus one ledger-specific field (Received From / Paid
 * To). Date is a plain YYYY-MM-DD text field rather than a native date picker — see
 * homework/CreateHomeworkSheet.js for the same reasoning (no new native dependency). */
export function LedgerRecordSheet({ visible, onDismiss, onCreated, categories, extraFieldLabel, extraFieldKey, useCreateMutation }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createRecord, createState] = useCreateMutation();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [extraValue, setExtraValue] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setCategory(null);
      setAmount('');
      setDate('');
      setPaymentMode('cash');
      setExtraValue('');
      setDescription('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const numericAmount = Number(amount);
    if (!title.trim() || !category || !amount.trim() || !date.trim()) {
      setError('Title, category, amount and date are all required');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!DATE_PATTERN.test(date.trim())) {
      setError('Date must be in YYYY-MM-DD format');
      return;
    }

    try {
      await createRecord({
        title: title.trim(),
        category,
        amount: numericAmount,
        date: date.trim(),
        paymentMode,
        description: description.trim(),
        [extraFieldKey]: extraValue.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save record');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Record</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {categories.map((c) => (
              <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ marginTop: spacing.sm }} disabled={createState.isLoading} />
          <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>PAYMENT MODE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {PAYMENT_MODES.map((m) => (
              <Chip key={m} selected={m === paymentMode} onPress={() => setPaymentMode(m)}>
                {paymentModeLabel(m)}
              </Chip>
            ))}
          </ScrollView>

          <FormField label={extraFieldLabel} value={extraValue} onChangeText={setExtraValue} disabled={createState.isLoading} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={createState.isLoading} />

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

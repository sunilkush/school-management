import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAddManualPaymentMutation, useGetAllInvoicesQuery } from '../../store/api/apiSlice';

const PAYMENT_MODES = ['cash', 'bank transfer', 'UPI', 'card', 'cheque'];

export function AddManualPaymentSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [addPayment, createState] = useAddManualPaymentMutation();
  const invoicesQuery = useGetAllInvoicesQuery(undefined, { skip: !visible });
  const unpaidInvoices = (invoicesQuery.data ?? []).filter((inv) => inv.status !== 'paid');

  const [invoiceId, setInvoiceId] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setInvoiceId(null);
      setAmount('');
      setPaymentMode('cash');
      setTransactionId('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!invoiceId || !amount.trim()) {
      setError('Invoice and amount are both required');
      return;
    }
    try {
      await addPayment({ invoiceId, amount: Number(amount), paymentMode, transactionId: transactionId.trim() || undefined, status: 'success' }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Add Payment</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>INVOICE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {unpaidInvoices.map((inv) => (
              <Chip key={inv._id} selected={inv._id === invoiceId} onPress={() => setInvoiceId(inv._id)}>
                {inv.invoiceNumber} · {inv.schoolId?.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Transaction ID (optional)" value={transactionId} onChangeText={setTransactionId} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>PAYMENT MODE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {PAYMENT_MODES.map((m) => (
              <Chip key={m} selected={m === paymentMode} onPress={() => setPaymentMode(m)}>
                {m}
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Add
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

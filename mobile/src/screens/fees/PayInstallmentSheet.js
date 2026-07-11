import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { usePayInstallmentMutation } from '../../store/api/apiSlice';
import { formatCurrency } from '../../utils/format';

/**
 * Cash/Cheque only — the web app's Razorpay checkout can't be ported as-is (it loads Razorpay's
 * JS SDK via a <script> tag, which doesn't exist on native). A real "Pay Online" option needs
 * react-native-razorpay (a new native dependency requiring a dev-client rebuild) and isn't wired
 * up here rather than shipping a fake/broken online-payment button.
 */
export function PayInstallmentSheet({ installment, onDismiss, onPaid }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const remaining = installment ? installment.amount - installment.paidAmount : 0;

  const [amount, setAmount] = useState(String(remaining));
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState(null);
  const [payInstallment, payState] = usePayInstallmentMutation();

  useEffect(() => {
    if (installment) {
      setAmount(String(installment.amount - installment.paidAmount));
      setPaymentMode('cash');
      setTransactionId('');
      setError(null);
    }
  }, [installment]);

  const handleConfirm = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (numericAmount > remaining) {
      setError(`Amount cannot exceed the due amount of ${formatCurrency(remaining)}`);
      return;
    }

    try {
      await payInstallment({
        installmentId: installment._id,
        amount: numericAmount,
        paymentMethod: paymentMode,
        ...(paymentMode === 'cheque' && transactionId ? { transactionId } : {}),
      }).unwrap();
      onPaid?.();
    } catch (err) {
      setError(err?.message || 'Payment failed');
    }
  };

  return (
    <Portal>
      <Modal visible={Boolean(installment)} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        {installment && (
          <View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{installment.installmentName}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              Due: {formatCurrency(remaining)}
            </Text>

            <FormField label="Amount to Pay" value={amount} onChangeText={setAmount} keyboardType="numeric" disabled={payState.isLoading} />

            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>PAYMENT METHOD</Text>
            <SegmentedButtons
              value={paymentMode}
              onValueChange={setPaymentMode}
              buttons={[
                { value: 'cash', label: 'Cash' },
                { value: 'cheque', label: 'Cheque' },
              ]}
            />

            {paymentMode === 'cheque' && (
              <FormField label="Cheque Number" value={transactionId} onChangeText={setTransactionId} style={{ marginTop: spacing.sm }} disabled={payState.isLoading} />
            )}

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={payState.isLoading}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleConfirm} loading={payState.isLoading} disabled={payState.isLoading} style={{ flex: 1 }}>
                Confirm
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}

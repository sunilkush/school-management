import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { QueryState } from '../../components/ui/QueryState';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyFeesSummaryQuery, usePayStudentFeeMutation } from '../../store/api/apiSlice';

const PAYMENT_MODES = ['cash', 'online', 'bank_transfer', 'upi', 'cheque'];
const STATUS_COLOR = { pending: '#F59E0B', partial: '#2563EB', paid: '#22C55E' };

function FeeRow({ fee, onCollected }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [amount, setAmount] = useState(String(fee.dueAmount ?? 0));
  const [paymentMode, setPaymentMode] = useState('cash');
  const [error, setError] = useState(null);
  const [payStudentFee, payState] = usePayStudentFeeMutation();

  const handleCollect = async () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0 || amountNum > (fee.dueAmount ?? 0)) {
      setError(`Enter an amount up to ${formatCurrency(fee.dueAmount ?? 0)}`);
      return;
    }
    try {
      await payStudentFee({ id: fee._id, paidAmount: amountNum, paymentMode }).unwrap();
      onCollected?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{fee.feeStructureId?.feeHeadId?.name ?? 'Fee'}</Text>
        <StatusPill label={fee.status} color={STATUS_COLOR[fee.status] || colors.textMuted} />
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
        Due {formatCurrency(fee.dueAmount ?? 0)} of {formatCurrency(fee.totalAmount ?? 0)}
      </Text>

      {fee.status !== 'paid' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.sm }}>
            {PAYMENT_MODES.map((m) => (
              <Chip key={m} compact selected={m === paymentMode} onPress={() => setPaymentMode(m)}>
                {m.replace('_', ' ')}
              </Chip>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <FormField value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ flex: 1 }} disabled={payState.isLoading} />
            <Button mode="contained" compact onPress={handleCollect} loading={payState.isLoading} disabled={payState.isLoading}>
              Collect
            </Button>
          </View>
          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>}
        </>
      )}
    </View>
  );
}

export function CollectFeeSheet({ visible, onDismiss, student }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyFeesSummaryQuery(
    { studentId: student?.studentId, academicYearId },
    { skip: !visible || !student?.studentId }
  );
  const fees = data ?? [];

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{student?.name}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
            {student?.className}{student?.sectionName ? ` · ${student.sectionName}` : ''}
          </Text>

          <QueryState
            isLoading={isLoading || isFetching}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={fees.length === 0}
            emptyIcon="cash-multiple"
            emptyLabel="No fee records assigned to this student yet"
          >
            {fees.map((fee) => (
              <FeeRow key={fee._id} fee={fee} onCollected={refetch} />
            ))}
          </QueryState>

          <Button mode="outlined" onPress={onDismiss} style={{ marginTop: spacing.md }}>
            Close
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

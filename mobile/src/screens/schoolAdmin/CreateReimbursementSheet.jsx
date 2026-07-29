import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateReimbursementMutation, useGetEmployeesQuery } from '../../store/api/apiSlice';

const TYPES = [
  { value: 'travel', label: 'Travel' }, { value: 'fuel', label: 'Fuel' },
  { value: 'internet', label: 'Internet' }, { value: 'medical', label: 'Medical' },
  { value: 'food', label: 'Food' }, { value: 'other', label: 'Other' },
];

export function CreateReimbursementSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;

  const [createReimbursement, createState] = useCreateReimbursementMutation();
  const employeesQuery = useGetEmployeesQuery(undefined, { skip: !visible });
  const employees = employeesQuery.data ?? [];

  const [employeeId, setEmployeeId] = useState(null);
  const [type, setType] = useState('travel');
  const [amount, setAmount] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setEmployeeId(null);
      setType('travel');
      setAmount('');
      setClaimDate('');
      setDescription('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const amountNum = Number(amount);
    if (!employeeId || !amount.trim() || Number.isNaN(amountNum)) {
      setError('Employee and a valid Amount are required');
      return;
    }
    try {
      await createReimbursement({
        employeeId,
        academicYearId,
        type,
        amount: amountNum,
        claimDate: claimDate.trim() || undefined,
        description: description.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to submit reimbursement claim');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Reimbursement Claim</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EMPLOYEE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {employees.map((e) => (
              <Chip key={e._id} selected={e._id === employeeId} onPress={() => setEmployeeId(e._id)}>
                {e.userId?.name ?? 'Employee'}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t.value} selected={t.value === type} onPress={() => setType(t.value)}>
                {t.label}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Claim Date (YYYY-MM-DD, optional)" value={claimDate} onChangeText={setClaimDate} disabled={createState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Submit
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

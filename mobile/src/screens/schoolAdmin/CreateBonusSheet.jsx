import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateBonusMutation, useGetEmployeesQuery } from '../../store/api/apiSlice';

const TYPES = [
  { value: 'festival_bonus', label: 'Festival Bonus' },
  { value: 'performance_bonus', label: 'Performance Bonus' },
  { value: 'incentive', label: 'Incentive' },
  { value: 'target_bonus', label: 'Target Bonus' },
  { value: 'one_time_payout', label: 'One-Time Payout' },
];
const now = new Date();

export function CreateBonusSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;

  const [createBonus, createState] = useCreateBonusMutation();
  const employeesQuery = useGetEmployeesQuery(undefined, { skip: !visible });
  const employees = employeesQuery.data ?? [];

  const [employeeId, setEmployeeId] = useState(null);
  const [type, setType] = useState('festival_bonus');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payoutMonth, setPayoutMonth] = useState(String(now.getMonth() + 1));
  const [payoutYear, setPayoutYear] = useState(String(now.getFullYear()));
  const [rule, setRule] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setEmployeeId(null);
      setType('festival_bonus');
      setTitle('');
      setAmount('');
      setPayoutMonth(String(now.getMonth() + 1));
      setPayoutYear(String(now.getFullYear()));
      setRule('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const amountNum = Number(amount);
    const monthNum = Number(payoutMonth);
    const yearNum = Number(payoutYear);
    if (!employeeId || !title.trim() || !amount.trim() || Number.isNaN(amountNum) || !monthNum || monthNum < 1 || monthNum > 12 || !yearNum) {
      setError('Employee, Title, Amount and a valid Payout Month/Year are all required');
      return;
    }
    try {
      await createBonus({
        employeeId,
        academicYearId,
        type,
        title: title.trim(),
        amount: amountNum,
        payoutMonth: monthNum,
        payoutYear: yearNum,
        rule: rule.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create bonus');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Bonus / Incentive</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EMPLOYEE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {employees.map((e) => (
              <Chip key={e._id} selected={e._id === employeeId} onPress={() => setEmployeeId(e._id)}>
                {e.userId?.name ?? 'Employee'}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {TYPES.map((t) => (
              <Chip key={t.value} selected={t.value === type} onPress={() => setType(t.value)}>
                {t.label}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" disabled={createState.isLoading} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Payout Month (1-12)" value={payoutMonth} onChangeText={setPayoutMonth} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
            <FormField label="Payout Year" value={payoutYear} onChangeText={setPayoutYear} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
          </View>
          <FormField label="Rule / Note (optional)" value={rule} onChangeText={setRule} multiline disabled={createState.isLoading} />

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

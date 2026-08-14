import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateAdvanceMutation, useGetActiveAcademicYearQuery, useGetEmployeesQuery } from '../../store/api/apiSlice';

export function CreateSalaryAdvanceSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [createAdvance, createState] = useCreateAdvanceMutation();
  const employeesQuery = useGetEmployeesQuery(undefined, { skip: !visible });
  const employees = employeesQuery.data ?? [];

  const [employeeId, setEmployeeId] = useState(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setEmployeeId(null);
      setTotalAmount('');
      setEmiAmount('');
      setStartMonth('');
      setNote('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const totalNum = Number(totalAmount);
    const emiNum = Number(emiAmount);
    if (!employeeId || !totalAmount.trim() || Number.isNaN(totalNum) || !emiAmount.trim() || Number.isNaN(emiNum) || !startMonth.trim()) {
      setError('Employee, Total Amount, EMI Amount and Start Month are all required');
      return;
    }
    try {
      await createAdvance({
        employeeId,
        academicYearId,
        totalAmount: totalNum,
        emiAmount: emiNum,
        startMonth: startMonth.trim(),
        note: note.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to submit advance request');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Salary Advance</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EMPLOYEE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {employees.map((e) => (
              <Chip key={e._id} selected={e._id === employeeId} onPress={() => setEmployeeId(e._id)}>
                {e.userId?.name ?? 'Employee'}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Total Amount" value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Monthly EMI Amount" value={emiAmount} onChangeText={setEmiAmount} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Start Month (YYYY-MM-DD)" value={startMonth} onChangeText={setStartMonth} disabled={createState.isLoading} />
          <FormField label="Note (optional)" value={note} onChangeText={setNote} multiline disabled={createState.isLoading} />

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

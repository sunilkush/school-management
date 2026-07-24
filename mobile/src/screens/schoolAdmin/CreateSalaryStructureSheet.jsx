import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreatePayrollStructureMutation, useGetEmployeesQuery } from '../../store/api/apiSlice';

const STATUSES = ['active', 'inactive'];

export function CreateSalaryStructureSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createStructure, createState] = useCreatePayrollStructureMutation();
  const employeesQuery = useGetEmployeesQuery(undefined, { skip: !visible });
  const employees = employeesQuery.data ?? [];

  const [employeeId, setEmployeeId] = useState(null);
  const [basic, setBasic] = useState('');
  const [hra, setHra] = useState('');
  const [da, setDa] = useState('');
  const [specialAllowance, setSpecialAllowance] = useState('');
  const [grossMonthly, setGrossMonthly] = useState('');
  const [vpfPercent, setVpfPercent] = useState('');
  const [professionalTaxEnabled, setProfessionalTaxEnabled] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setEmployeeId(null);
      setBasic('');
      setHra('');
      setDa('');
      setSpecialAllowance('');
      setGrossMonthly('');
      setVpfPercent('');
      setProfessionalTaxEnabled(false);
      setEffectiveFrom('');
      setEffectiveTo('');
      setStatus('active');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const basicNum = Number(basic);
    const grossNum = Number(grossMonthly);
    if (!employeeId || !basic.trim() || Number.isNaN(basicNum) || !grossMonthly.trim() || Number.isNaN(grossNum) || !effectiveFrom.trim()) {
      setError('Employee, Basic, Gross Monthly and Effective From are all required');
      return;
    }
    try {
      await createStructure({
        employeeId,
        basic: basicNum,
        hra: Number(hra) || 0,
        da: Number(da) || 0,
        specialAllowance: Number(specialAllowance) || 0,
        grossMonthly: grossNum,
        vpfPercent: Number(vpfPercent) || 0,
        professionalTaxEnabled,
        effectiveFrom: effectiveFrom.trim(),
        effectiveTo: effectiveTo.trim() || null,
        status,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create salary structure');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Salary Structure</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EMPLOYEE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {employees.map((e) => (
              <Chip key={e._id} selected={e._id === employeeId} onPress={() => setEmployeeId(e._id)}>
                {e.userId?.name ?? 'Employee'}
              </Chip>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Basic" value={basic} onChangeText={setBasic} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
            <FormField label="HRA" value={hra} onChangeText={setHra} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="DA" value={da} onChangeText={setDa} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
            <FormField label="Special Allowance" value={specialAllowance} onChangeText={setSpecialAllowance} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
          </View>
          <FormField label="Gross Monthly" value={grossMonthly} onChangeText={setGrossMonthly} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="VPF % (optional)" value={vpfPercent} onChangeText={setVpfPercent} keyboardType="numeric" disabled={createState.isLoading} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Professional Tax Enabled</Text>
            <Switch value={professionalTaxEnabled} onValueChange={setProfessionalTaxEnabled} disabled={createState.isLoading} />
          </View>

          <FormField label="Effective From (YYYY-MM-DD)" value={effectiveFrom} onChangeText={setEffectiveFrom} disabled={createState.isLoading} />
          <FormField label="Effective To (YYYY-MM-DD, optional)" value={effectiveTo} onChangeText={setEffectiveTo} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {STATUSES.map((s) => (
              <Chip key={s} selected={s === status} onPress={() => setStatus(s)}>
                {s}
              </Chip>
            ))}
          </ScrollView>

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

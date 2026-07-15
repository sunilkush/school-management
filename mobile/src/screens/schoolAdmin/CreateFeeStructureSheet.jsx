import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateFeeStructureMutation, useGetFeeHeadsBySchoolQuery } from '../../store/api/apiSlice';

const FREQUENCIES = ['monthly', 'quarterly', 'yearly'];

export function CreateFeeStructureSheet({ visible, onDismiss, onCreated, classes, schoolId, academicYearId }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createFeeStructure, createState] = useCreateFeeStructureMutation();
  const feeHeadsQuery = useGetFeeHeadsBySchoolQuery(undefined, { skip: !visible });
  const feeHeads = feeHeadsQuery.data ?? [];

  const [classId, setClassId] = useState(null);
  const [feeHeadId, setFeeHeadId] = useState(null);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setClassId(null);
      setFeeHeadId(null);
      setAmount('');
      setFrequency('monthly');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    const amountNum = Number(amount);
    if (!classId || !feeHeadId || !amount.trim() || Number.isNaN(amountNum) || amountNum < 0) {
      setError('Class, fee category and a valid amount are all required');
      return;
    }
    try {
      await createFeeStructure({
        schoolId,
        schoolClassId: classId,
        academicYearId,
        feeHeadId,
        amount: amountNum,
        frequency,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create fee structure');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Fee Structure</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => setClassId(c._id)}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>FEE CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {feeHeads.map((fh) => (
              <Chip key={fh._id} selected={fh._id === feeHeadId} onPress={() => setFeeHeadId(fh._id)}>
                {fh.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ marginTop: spacing.sm }} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>FREQUENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {FREQUENCIES.map((f) => (
              <Chip key={f} selected={f === frequency} onPress={() => setFrequency(f)}>
                {f}
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

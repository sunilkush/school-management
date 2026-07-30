import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGenerateSchoolInvoiceMutation, useGetAllSchoolsQuery } from '../../store/api/apiSlice';

export function CreateInvoiceSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [generateInvoice, createState] = useGenerateSchoolInvoiceMutation();
  const schoolsQuery = useGetAllSchoolsQuery({}, { skip: !visible });
  const schools = schoolsQuery.data?.schools ?? [];

  const [schoolId, setSchoolId] = useState(null);
  const [discount, setDiscount] = useState('0');
  const [taxGst, setTaxGst] = useState('0');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setSchoolId(null);
      setDiscount('0');
      setTaxGst('0');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!schoolId) {
      setError('Pick a school');
      return;
    }
    try {
      await generateInvoice({ schoolId, discount: Number(discount) || 0, taxGst: Number(taxGst) || 0 }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to generate invoice — the school may not have an active subscription');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Create Invoice</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {schools.map((s) => (
              <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Discount" value={discount} onChangeText={setDiscount} keyboardType="numeric" disabled={createState.isLoading} />
          <FormField label="Tax / GST" value={taxGst} onChangeText={setTaxGst} keyboardType="numeric" disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Generate
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateAcademicYearMutation } from '../../store/api/apiSlice';

export function CreateAcademicYearSheet({ visible, onDismiss, onCreated, schoolId }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createYear, createState] = useCreateAcademicYearMutation();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setStartDate('');
      setEndDate('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!startDate.trim() || !endDate.trim()) {
      setError('Start date and end date are both required');
      return;
    }
    try {
      await createYear({ schoolId, startDate: startDate.trim(), endDate: endDate.trim() }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create academic year');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Academic Year</Text>

          <FormField label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} disabled={createState.isLoading} />
          <FormField label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} disabled={createState.isLoading} />

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

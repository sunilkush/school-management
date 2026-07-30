import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateSubscriptionPlanMutation, useUpdateSubscriptionPlanMutation } from '../../store/api/apiSlice';

const CATEGORIES = ['Starter', 'Premium', 'Enterprise', 'Custom'];

export function CreateSubscriptionPlanSheet({ visible, onDismiss, onCreated, plan }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createPlan, createState] = useCreateSubscriptionPlanMutation();
  const [updatePlan, updateState] = useUpdateSubscriptionPlanMutation();
  const isEditing = Boolean(plan);
  const saveState = isEditing ? updateState : createState;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Starter');
  const [price, setPrice] = useState('');
  const [durationInDays, setDurationInDays] = useState('365');
  const [maxStudents, setMaxStudents] = useState('');
  const [maxTeachers, setMaxTeachers] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(plan?.name ?? '');
      setCategory(plan?.category ?? 'Starter');
      setPrice(String(plan?.price ?? ''));
      setDurationInDays(String(plan?.durationInDays ?? '365'));
      setMaxStudents(String(plan?.limits?.maxStudents ?? ''));
      setMaxTeachers(String(plan?.limits?.maxTeachers ?? ''));
      setMaxUsers(String(plan?.limits?.maxUsers ?? ''));
      setError(null);
    }
  }, [visible, plan]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !durationInDays.trim()) {
      setError('Name, price and duration are all required');
      return;
    }
    const payload = {
      name: name.trim(),
      category,
      price: Number(price),
      durationInDays: Number(durationInDays),
      limits: {
        maxStudents: maxStudents.trim() ? Number(maxStudents) : undefined,
        maxTeachers: maxTeachers.trim() ? Number(maxTeachers) : undefined,
        maxUsers: maxUsers.trim() ? Number(maxUsers) : undefined,
      },
    };
    try {
      if (isEditing) {
        await updatePlan({ id: plan._id, ...payload }).unwrap();
      } else {
        await createPlan(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to save plan');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Plan' : 'New Plan'}</Text>

          <FormField label="Name" value={name} onChangeText={setName} disabled={saveState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={c === category} onPress={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" disabled={saveState.isLoading} />
          <FormField label="Duration (days)" value={durationInDays} onChangeText={setDurationInDays} keyboardType="numeric" disabled={saveState.isLoading} />
          <FormField label="Max Students (optional)" value={maxStudents} onChangeText={setMaxStudents} keyboardType="numeric" disabled={saveState.isLoading} />
          <FormField label="Max Teachers (optional)" value={maxTeachers} onChangeText={setMaxTeachers} keyboardType="numeric" disabled={saveState.isLoading} />
          <FormField label="Max Users (optional)" value={maxUsers} onChangeText={setMaxUsers} keyboardType="numeric" disabled={saveState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

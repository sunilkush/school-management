import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetSubscriptionPlansQuery, useRegisterSchoolMutation } from '../../store/api/apiSlice';

export function CreateSchoolSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [registerSchool, createState] = useRegisterSchoolMutation();
  const plansQuery = useGetSubscriptionPlansQuery(undefined, { skip: !visible });
  const plans = (plansQuery.data ?? []).filter((p) => p.isActive);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [planId, setPlanId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setWebsite('');
      setPlanId(null);
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are both required');
      return;
    }
    try {
      await registerSchool({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        isActive: true,
        subscriptionPlan: planId || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to register school');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New School</Text>

          <FormField label="Name" value={name} onChangeText={setName} disabled={createState.isLoading} />
          <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" disabled={createState.isLoading} />
          <FormField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" disabled={createState.isLoading} />
          <FormField label="Address (optional)" value={address} onChangeText={setAddress} disabled={createState.isLoading} />
          <FormField label="Website (optional)" value={website} onChangeText={setWebsite} autoCapitalize="none" disabled={createState.isLoading} />

          {plans.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SUBSCRIPTION PLAN (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {plans.map((p) => (
                  <Chip key={p._id} selected={p._id === planId} onPress={() => setPlanId(p._id === planId ? null : p._id)}>
                    {p.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

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

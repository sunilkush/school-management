import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useUpdateAlumniProfileMutation } from '../../store/api/apiSlice';

export function EditAlumniSheet({ alumnus, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [updateAlumniProfile, updateState] = useUpdateAlumniProfileMutation();

  const [currentOccupation, setCurrentOccupation] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [currentPhone, setCurrentPhone] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [isReachable, setIsReachable] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (alumnus) {
      setCurrentOccupation(alumnus.currentOccupation || '');
      setCurrentEmployer(alumnus.currentEmployer || '');
      setCurrentPhone(alumnus.currentPhone || '');
      setCurrentEmail(alumnus.currentEmail || '');
      setIsReachable(alumnus.isReachable !== false);
      setError(null);
    }
  }, [alumnus]);

  const handleSave = async () => {
    try {
      await updateAlumniProfile({
        id: alumnus._id,
        currentOccupation: currentOccupation.trim(),
        currentEmployer: currentEmployer.trim(),
        currentPhone: currentPhone.trim(),
        currentEmail: currentEmail.trim(),
        isReachable,
      }).unwrap();
      onDismiss?.();
    } catch (err) {
      setError(err?.message || 'Failed to update profile');
    }
  };

  return (
    <Portal>
      <Modal visible={!!alumnus} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Edit — {alumnus?.fullName}</Text>

          <TextInput label="Current occupation" value={currentOccupation} onChangeText={setCurrentOccupation} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Current employer" value={currentEmployer} onChangeText={setCurrentEmployer} mode="outlined" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Phone" value={currentPhone} onChangeText={setCurrentPhone} mode="outlined" keyboardType="phone-pad" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Email" value={currentEmail} onChangeText={setCurrentEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={{ marginBottom: spacing.sm }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>Reachable</Text>
            <Switch value={isReachable} onValueChange={setIsReachable} />
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={updateState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={updateState.isLoading} disabled={updateState.isLoading} style={{ flex: 1 }}>Save</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

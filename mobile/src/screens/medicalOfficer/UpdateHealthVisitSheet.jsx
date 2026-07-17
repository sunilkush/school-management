import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useUpdateHealthVisitMutation } from '../../store/api/apiSlice';

const SEVERITIES = ['Minor', 'Moderate', 'Severe'];
const STATUSES = ['Open', 'Resolved'];

/** Edits an existing visit — controlled by whether `visit` is set (null closes the sheet). */
export function UpdateHealthVisitSheet({ visit, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [updateHealthVisit, updateState] = useUpdateHealthVisitMutation();

  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [severity, setSeverity] = useState('Minor');
  const [temperature, setTemperature] = useState('');
  const [referredToHospital, setReferredToHospital] = useState(false);
  const [referredTo, setReferredTo] = useState('');
  const [parentNotified, setParentNotified] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('Open');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visit) {
      setTreatmentGiven(visit.treatmentGiven || '');
      setSeverity(visit.severity || 'Minor');
      setTemperature(visit.temperature != null ? String(visit.temperature) : '');
      setReferredToHospital(!!visit.referredToHospital);
      setReferredTo(visit.referredTo || '');
      setParentNotified(!!visit.parentNotified);
      setFollowUpDate(visit.followUpDate ? visit.followUpDate.slice(0, 10) : '');
      setStatus(visit.status || 'Open');
      setError(null);
    }
  }, [visit]);

  const handleSave = async () => {
    try {
      await updateHealthVisit({
        id: visit._id,
        treatmentGiven: treatmentGiven.trim(),
        severity,
        temperature: temperature ? Number(temperature) : undefined,
        referredToHospital,
        referredTo: referredToHospital ? referredTo.trim() : '',
        parentNotified,
        followUpDate: followUpDate || null,
        status,
      }).unwrap();
      onDismiss?.();
    } catch (err) {
      setError(err?.message || 'Failed to update visit');
    }
  };

  return (
    <Portal>
      <Modal visible={!!visit} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Update Visit — {visit?.studentName}</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SEVERITY</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {SEVERITIES.map((s) => <Chip key={s} selected={s === severity} onPress={() => setSeverity(s)}>{s}</Chip>)}
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STATUS</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {STATUSES.map((s) => <Chip key={s} selected={s === status} onPress={() => setStatus(s)}>{s}</Chip>)}
          </View>

          <TextInput label="Temperature (°F)" value={temperature} onChangeText={setTemperature} mode="outlined" keyboardType="decimal-pad" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Treatment given" value={treatmentGiven} onChangeText={setTreatmentGiven} mode="outlined" multiline style={{ marginBottom: spacing.sm }} />
          <TextInput label="Follow-up date (YYYY-MM-DD)" value={followUpDate} onChangeText={setFollowUpDate} mode="outlined" style={{ marginBottom: spacing.sm }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Referred to hospital</Text>
            <Switch value={referredToHospital} onValueChange={setReferredToHospital} />
          </View>
          {referredToHospital && (
            <TextInput label="Referred to" value={referredTo} onChangeText={setReferredTo} mode="outlined" style={{ marginBottom: spacing.sm }} />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>Parent notified</Text>
            <Switch value={parentNotified} onValueChange={setParentNotified} />
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

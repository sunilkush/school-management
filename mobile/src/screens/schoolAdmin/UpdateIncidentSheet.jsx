import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useUpdateIncidentMutation } from '../../store/api/apiSlice';

const SEVERITIES = ['Minor', 'Moderate', 'Major'];
const STATUSES = ['Open', 'Resolved'];

export function UpdateIncidentSheet({ incident, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [updateIncident, updateState] = useUpdateIncidentMutation();

  const [severity, setSeverity] = useState('Minor');
  const [status, setStatus] = useState('Open');
  const [actionTaken, setActionTaken] = useState('');
  const [demeritPoints, setDemeritPoints] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [parentMeetingRequired, setParentMeetingRequired] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (incident) {
      setSeverity(incident.severity || 'Minor');
      setStatus(incident.status || 'Open');
      setActionTaken(incident.actionTaken || '');
      setDemeritPoints(incident.demeritPoints != null ? String(incident.demeritPoints) : '');
      setResolutionNotes(incident.resolutionNotes || '');
      setParentMeetingRequired(!!incident.parentMeetingRequired);
      setError(null);
    }
  }, [incident]);

  const handleSave = async () => {
    try {
      await updateIncident({
        id: incident._id,
        severity,
        status,
        actionTaken: actionTaken.trim(),
        demeritPoints: demeritPoints ? Number(demeritPoints) : 0,
        resolutionNotes: resolutionNotes.trim(),
        parentMeetingRequired,
      }).unwrap();
      onDismiss?.();
    } catch (err) {
      setError(err?.message || 'Failed to update incident');
    }
  };

  return (
    <Portal>
      <Modal visible={!!incident} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Update Incident — {incident?.studentName}</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SEVERITY</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {SEVERITIES.map((s) => <Chip key={s} selected={s === severity} onPress={() => setSeverity(s)}>{s}</Chip>)}
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STATUS</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {STATUSES.map((s) => <Chip key={s} selected={s === status} onPress={() => setStatus(s)}>{s}</Chip>)}
          </View>

          <TextInput label="Action taken" value={actionTaken} onChangeText={setActionTaken} mode="outlined" multiline style={{ marginBottom: spacing.sm }} />
          <TextInput label="Demerit points" value={demeritPoints} onChangeText={setDemeritPoints} mode="outlined" keyboardType="number-pad" style={{ marginBottom: spacing.sm }} />
          <TextInput label="Resolution notes" value={resolutionNotes} onChangeText={setResolutionNotes} mode="outlined" multiline style={{ marginBottom: spacing.sm }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>Parent meeting required</Text>
            <Switch value={parentMeetingRequired} onValueChange={setParentMeetingRequired} />
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

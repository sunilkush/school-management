import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetHealthProfileQuery, useUpsertHealthProfileMutation } from '../../store/api/apiSlice';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Chip-list editor for allergies/conditions/medications — type + Enter-equivalent "Add" adds a tag,
// tap a chip's close icon to remove it. Matches the model's plain string-array fields.
function TagChips({ label, values, onChange }) {
  const { colors, typography, spacing } = useAppTheme();
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs }}>
        {values.map((v) => (
          <Chip key={v} onClose={() => onChange(values.filter((x) => x !== v))}>{v}</Chip>
        ))}
      </View>
      <TextInput
        mode="outlined"
        dense
        placeholder={`Add ${label.toLowerCase()}`}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        right={<TextInput.Icon icon="plus" onPress={add} />}
      />
    </View>
  );
}

/** Student health profile (conditions/allergies/blood group/emergency contact) — opened for a
 * specific studentId (controlled by whether `studentId` is set). */
export function HealthProfileSheet({ studentId, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const profileQuery = useGetHealthProfileQuery(studentId, { skip: !studentId });
  const [upsertHealthProfile, saveState] = useUpsertHealthProfileMutation();

  const [bloodGroup, setBloodGroup] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [chronicConditions, setChronicConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const p = profileQuery.data;
    setBloodGroup(p?.bloodGroup || '');
    setHeight(p?.height != null ? String(p.height) : '');
    setWeight(p?.weight != null ? String(p.weight) : '');
    setAllergies(p?.allergies || []);
    setChronicConditions(p?.chronicConditions || []);
    setMedications(p?.medications || []);
    setEmergencyName(p?.emergencyContact?.name || '');
    setEmergencyPhone(p?.emergencyContact?.phone || '');
    setNotes(p?.notes || '');
    setError(null);
  }, [profileQuery.data, studentId]);

  const handleSave = async () => {
    try {
      await upsertHealthProfile({
        studentId,
        bloodGroup,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        allergies,
        chronicConditions,
        medications,
        emergencyContact: { name: emergencyName, phone: emergencyPhone },
        notes,
      }).unwrap();
      onDismiss?.();
    } catch (err) {
      setError(err?.message || 'Failed to save profile');
    }
  };

  return (
    <Portal>
      <Modal visible={!!studentId} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Health Profile</Text>

          <QueryState isLoading={profileQuery.isLoading} isError={profileQuery.isError} error={profileQuery.error} onRetry={profileQuery.refetch}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>BLOOD GROUP</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
              {BLOOD_GROUPS.map((bg) => <Chip key={bg} selected={bg === bloodGroup} onPress={() => setBloodGroup(bg)}>{bg}</Chip>)}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
              <TextInput label="Height (cm)" value={height} onChangeText={setHeight} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1 }} />
              <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>

            <TagChips label="Allergies" values={allergies} onChange={setAllergies} />
            <TagChips label="Chronic Conditions" values={chronicConditions} onChange={setChronicConditions} />
            <TagChips label="Medications" values={medications} onChange={setMedications} />

            <TextInput label="Emergency Contact Name" value={emergencyName} onChangeText={setEmergencyName} mode="outlined" style={{ marginBottom: spacing.sm }} />
            <TextInput label="Emergency Contact Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} mode="outlined" keyboardType="phone-pad" style={{ marginBottom: spacing.sm }} />
            <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline style={{ marginBottom: spacing.md }} />

            {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>Close</Button>
              <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>Save</Button>
            </View>
          </QueryState>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

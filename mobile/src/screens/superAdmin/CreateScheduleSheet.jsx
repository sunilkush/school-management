import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateBackupScheduleMutation, useGetAllSchoolsQuery } from '../../store/api/apiSlice';

const TYPES = ['full', 'school', 'module'];
const MODULES = ['users_roles', 'students', 'fees', 'exams', 'documents', 'audit_logs'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'custom'];

/** Metadata-only CRUD — there is no cron engine executing these server-side, so no "next run"
 * countdown is shown; nextRunAt/lastRunAt are never written by the backend. */
export function CreateScheduleSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createSchedule, createState] = useCreateBackupScheduleMutation();
  const schoolsQuery = useGetAllSchoolsQuery({}, { skip: !visible });
  const schools = schoolsQuery.data?.schools ?? [];

  const [name, setName] = useState('');
  const [type, setType] = useState('full');
  const [schoolId, setSchoolId] = useState(null);
  const [modules, setModules] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('00:00');
  const [retentionDays, setRetentionDays] = useState('30');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setType('full');
      setSchoolId(null);
      setModules([]);
      setFrequency('daily');
      setTime('00:00');
      setRetentionDays('30');
      setError(null);
    }
  }, [visible]);

  const toggleModule = (m) => {
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (type === 'school' && !schoolId) {
      setError('Select a school for a school-scoped schedule');
      return;
    }
    if (type === 'module' && modules.length === 0) {
      setError('Select at least one module');
      return;
    }
    try {
      await createSchedule({
        name: name.trim(),
        type,
        schoolId: schoolId || undefined,
        modules,
        frequency,
        time: time.trim() || '00:00',
        retentionDays: Number(retentionDays) || 30,
        isActive: true,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create schedule');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Backup Schedule</Text>

          <FormField label="Name" value={name} onChangeText={setName} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          {type === 'school' && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {schools.map((s) => (
                  <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          {type === 'module' && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>MODULES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {MODULES.map((m) => (
                  <Chip key={m} selected={modules.includes(m)} onPress={() => toggleModule(m)}>
                    {m.replace('_', ' ')}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>FREQUENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {FREQUENCIES.map((f) => (
              <Chip key={f} selected={f === frequency} onPress={() => setFrequency(f)}>
                {f}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Time (HH:mm)" value={time} onChangeText={setTime} disabled={createState.isLoading} />
          <FormField label="Retention (days)" value={retentionDays} onChangeText={setRetentionDays} keyboardType="number-pad" disabled={createState.isLoading} />

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

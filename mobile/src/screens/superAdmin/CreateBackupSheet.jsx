import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateManualBackupMutation, useGetAcademicYearsBySchoolQuery, useGetAllSchoolsQuery } from '../../store/api/apiSlice';

const TYPES = ['full', 'school', 'module', 'academic_year'];
const MODULES = ['users_roles', 'students', 'fees', 'exams', 'documents', 'audit_logs'];
const STORAGE_PROVIDERS = ['local', 's3', 'cloudinary', 'spaces'];

function scopeForType(type) {
  if (type === 'school') return 'school';
  if (type === 'module') return 'module';
  return 'platform';
}

/** Manual backup creation is a synchronous, real operation (queries School/AcademicYear/
 * StudentEnrollment, writes a JSON file, computes a checksum) — the request resolving means the
 * backup already succeeded, no polling/queue involved. */
export function CreateBackupSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createBackup, createState] = useCreateManualBackupMutation();
  const schoolsQuery = useGetAllSchoolsQuery({}, { skip: !visible });
  const schools = schoolsQuery.data?.schools ?? [];

  const [type, setType] = useState('full');
  const [schoolId, setSchoolId] = useState(null);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [modules, setModules] = useState([]);
  const [notes, setNotes] = useState('');
  const [storageProvider, setStorageProvider] = useState('local');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState('30');
  const [error, setError] = useState(null);

  const yearsQuery = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId || type !== 'academic_year' });
  const years = yearsQuery.data ?? [];

  useEffect(() => {
    if (visible) {
      setType('full');
      setSchoolId(null);
      setAcademicYearId(null);
      setModules([]);
      setNotes('');
      setStorageProvider('local');
      setEncryptionEnabled(true);
      setRetentionDays('30');
      setError(null);
    }
  }, [visible]);

  const toggleModule = (m) => {
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleCreate = async () => {
    if (type === 'school' && !schoolId) {
      setError('Select a school for a school-scoped backup');
      return;
    }
    if (type === 'academic_year' && (!schoolId || !academicYearId)) {
      setError('Select a school and academic year');
      return;
    }
    if (type === 'module' && modules.length === 0) {
      setError('Select at least one module');
      return;
    }
    try {
      await createBackup({
        type,
        scope: scopeForType(type),
        schoolId: schoolId || undefined,
        academicYearId: academicYearId || undefined,
        modules,
        notes: notes.trim(),
        storageProvider,
        encryptionEnabled,
        retentionDays: Number(retentionDays) || 30,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create backup');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Manual Backup</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t.replace('_', ' ')}
              </Chip>
            ))}
          </ScrollView>

          {(type === 'school' || type === 'academic_year') && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {schools.map((s) => (
                  <Chip key={s._id} selected={s._id === schoolId} onPress={() => { setSchoolId(s._id); setAcademicYearId(null); }}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          {type === 'academic_year' && schoolId && years.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ACADEMIC YEAR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {years.map((y) => (
                  <Chip key={y._id} selected={y._id === academicYearId} onPress={() => setAcademicYearId(y._id)}>
                    {y.name}
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

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STORAGE PROVIDER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {STORAGE_PROVIDERS.map((p) => (
              <Chip key={p} selected={p === storageProvider} onPress={() => setStorageProvider(p)}>
                {p}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Retention (days)" value={retentionDays} onChangeText={setRetentionDays} keyboardType="number-pad" disabled={createState.isLoading} />
          <FormField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} disabled={createState.isLoading} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Encryption enabled</Text>
            <Switch value={encryptionEnabled} onValueChange={setEncryptionEnabled} disabled={createState.isLoading} />
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Run Backup
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetSystemBackupsQuery, useRequestRestoreJobMutation } from '../../store/api/apiSlice';

const RESTORE_TYPES = ['full', 'school', 'module'];
const MODULES = ['users_roles', 'students', 'fees', 'exams', 'documents', 'audit_logs'];

/** Requesting a restore needs no MFA — only approving one does (see ApproveRestoreSheet). Only
 * successful backups can be restored from. */
export function RequestRestoreSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [requestRestore, requestState] = useRequestRestoreJobMutation();
  const backupsQuery = useGetSystemBackupsQuery({ status: 'success', limit: 50 }, { skip: !visible });
  const backups = backupsQuery.data?.data ?? [];

  const [backupId, setBackupId] = useState(null);
  const [restoreType, setRestoreType] = useState('full');
  const [modules, setModules] = useState([]);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setBackupId(null);
      setRestoreType('full');
      setModules([]);
      setDryRun(true);
      setError(null);
    }
  }, [visible]);

  const toggleModule = (m) => {
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleRequest = async () => {
    if (!backupId) {
      setError('Select a backup to restore from');
      return;
    }
    if (restoreType === 'module' && modules.length === 0) {
      setError('Select at least one module');
      return;
    }
    try {
      await requestRestore({ backupId, restoreType, modules, dryRun }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to request restore');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Request Restore</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>BACKUP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {backups.map((b) => (
              <Chip key={b._id} selected={b._id === backupId} onPress={() => setBackupId(b._id)}>
                {b.backupNo}
              </Chip>
            ))}
          </ScrollView>
          {backups.length === 0 && !backupsQuery.isLoading && (
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>No successful backups available to restore from.</Text>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>RESTORE TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {RESTORE_TYPES.map((t) => (
              <Chip key={t} selected={t === restoreType} onPress={() => setRestoreType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          {restoreType === 'module' && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>MODULES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {MODULES.map((m) => (
                  <Chip key={m} selected={modules.includes(m)} onPress={() => toggleModule(m)}>
                    {m.replace('_', ' ')}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Dry run</Text>
            <Switch value={dryRun} onValueChange={setDryRun} disabled={requestState.isLoading} />
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={requestState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleRequest} loading={requestState.isLoading} disabled={requestState.isLoading} style={{ flex: 1 }}>
              Request
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

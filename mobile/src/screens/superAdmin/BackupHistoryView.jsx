import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateBackupSheet } from './CreateBackupSheet';
import { formatBytes, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeleteSystemBackupMutation, useGetSystemBackupsQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { queued: '#94A3B8', running: '#2563EB', success: '#22C55E', failed: '#EF4444', cancelled: '#64748B' };

// Backup creation is a synchronous real operation (queries the DB, writes a JSON file, computes a
// checksum, all before the request resolves) — there is no queue/worker, so every backup ends up
// "success" or throws immediately; "queued"/"running"/"cancelled" are schema-legal but no code
// path produces them from a real create call. Downloading the backup file is deliberately not
// built (same reasoning as every other deferred file download in this app — needs a new native
// file-system/sharing dependency); this view shows metadata only.
export function BackupHistoryView() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSystemBackupsQuery({ limit: 30 });
  const backups = data?.data ?? [];
  const [deleteBackup, deleteState] = useDeleteSystemBackupMutation();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Backup
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={backups.length === 0}
        emptyIcon="backup-restore"
        emptyLabel="No backups yet"
      >
        {backups.map((b) => (
          <AccentListCard
            key={b._id}
            accent={STATUS_COLOR[b.status] || colors.primary}
            avatar={<IconWell icon="backup-restore" color={STATUS_COLOR[b.status] || colors.primary} size={38} />}
            title={b.backupNo}
            subtitle={`${b.type} · ${b.scope}`}
            badge={<StatusPill label={b.status} color={STATUS_COLOR[b.status] || colors.textMuted} />}
            meta={[
              { label: 'Storage', value: b.storageProvider },
              { label: 'Size', value: formatBytes(b.fileSize) },
              { label: 'Created', value: formatDate(b.createdAt) },
              { label: 'Created By', value: b.createdBy?.name ?? '—' },
              { label: 'Encrypted', value: b.encryptionEnabled ? 'Yes' : 'No' },
              ...(b.notes ? [{ label: 'Notes', value: b.notes }] : []),
            ]}
            expandable
            actions={<IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => deleteBackup(b._id)} />}
          />
        ))}
      </QueryState>

      <CreateBackupSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetBackupAuditLogsQuery } from '../../store/api/apiSlice';

const ACTION_COLOR = {
  backup_created: '#22C55E',
  backup_failed: '#EF4444',
  backup_deleted: '#64748B',
  restore_requested: '#F59E0B',
  restore_approved: '#2563EB',
  restore_started: '#2563EB',
  restore_completed: '#22C55E',
};

// A genuine third logging system, separate from both ActivityLog (ActivityLogsScreen) and
// AuditLog (the platform-wide System Control audit trail) — this hits the backup-scoped
// /system-backups/audit-logs endpoint specifically, not either of those.
export function BackupAuditLogView() {
  const { colors } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetBackupAuditLogsQuery({ limit: 30 });
  const logs = data?.data ?? [];

  return (
    <View>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={logs.length === 0}
        emptyIcon="history"
        emptyLabel="No backup audit log entries yet"
      >
        {logs.map((l) => (
          <AccentListCard
            key={l._id}
            accent={ACTION_COLOR[l.action] || colors.primary}
            avatar={<IconWell icon="history" color={ACTION_COLOR[l.action] || colors.primary} size={38} />}
            title={l.action.replace(/_/g, ' ')}
            subtitle={l.actorId?.name ?? 'Unknown Actor'}
            badge={<StatusPill label={formatDate(l.createdAt)} color={colors.textMuted} />}
            meta={[
              ...(l.message ? [{ label: 'Message', value: l.message }] : []),
              ...(l.ipAddress ? [{ label: 'IP Address', value: l.ipAddress }] : []),
              { label: 'Actor Email', value: l.actorId?.email ?? '—' },
            ]}
            expandable
          />
        ))}
      </QueryState>
    </View>
  );
}

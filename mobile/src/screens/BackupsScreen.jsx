import React, { useState } from 'react';
import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { BackupHistoryView } from './superAdmin/BackupHistoryView';
import { BackupSchedulesView } from './superAdmin/BackupSchedulesView';
import { RestoreJobsView } from './superAdmin/RestoreJobsView';
import { BackupAuditLogView } from './superAdmin/BackupAuditLogView';
import { formatBytes, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetBackupSummaryQuery } from '../store/api/apiSlice';

const TABS = [
  { value: 'history', label: 'History' },
  { value: 'schedules', label: 'Schedules' },
  { value: 'restore', label: 'Restore' },
  { value: 'audit', label: 'Audit' },
];

/** Mirrors frontend/src/pages/Super_Admin/System_Settings/Backups.jsx: an 8-metric summary row +
 * Manual Backup/History (folded into one tab, since creating a backup is just a "New Backup"
 * button over the same list) + Schedules + Restore Jobs + a backup-scoped Audit Log tab. */
export function BackupsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [tab, setTab] = useState('history');

  const summaryQuery = useGetBackupSummaryQuery();
  const summary = summaryQuery.data ?? {};

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="backup-restore" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>System Backup</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Health: {summary.backupHealthStatus ?? '—'}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total Backups" metric={{ label: 'Total Backups', icon: 'backup-restore', color: colors.primary, value: summary.totalBackups ?? 0 }} />
          <StatCard label="Successful" metric={{ label: 'Successful', icon: 'check-circle-outline', color: '#22C55E', value: summary.successfulBackups ?? 0 }} />
          <StatCard label="Failed" metric={{ label: 'Failed', icon: 'close-circle-outline', color: '#EF4444', value: summary.failedBackups ?? 0 }} />
          <StatCard label="Storage Used" metric={{ label: 'Storage Used', icon: 'harddisk', color: '#F59E0B', value: formatBytes(summary.storageUsed) }} />
          <StatCard label="Pending Restores" metric={{ label: 'Pending Restores', icon: 'restore', color: '#2563EB', value: summary.pendingRestores ?? 0 }} />
          <StatCard label="Last Backup" metric={{ label: 'Last Backup', icon: 'calendar-check-outline', color: '#7C3AED', value: formatDate(summary.lastBackupTime) }} />
          <StatCard label="Next Scheduled" metric={{ label: 'Next Scheduled', icon: 'calendar-clock-outline', color: '#14B8A6', value: formatDate(summary.nextScheduledBackup) }} />
        </StatGrid>
      </View>

      <SegmentedButtons value={tab} onValueChange={setTab} style={{ marginBottom: spacing.md }} buttons={TABS} />

      {tab === 'history' && <BackupHistoryView />}
      {tab === 'schedules' && <BackupSchedulesView />}
      {tab === 'restore' && <RestoreJobsView />}
      {tab === 'audit' && <BackupAuditLogView />}
    </ScreenContainer>
  );
}

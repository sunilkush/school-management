import React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { timeAgo } from '../utils/format';
import { confirmDelete } from '../utils/confirm';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteActivityLogMutation, useGetActivityLogsQuery } from '../store/api/apiSlice';

/** Platform-wide activity feed — distinct from System Control's own separate AuditLog model
 * (not built yet). Read-only browse; delete is Super Admin only (matches backend gating). */
export function ActivityLogsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();
  const canDelete = role?.name === 'Super Admin';
  const { data, isLoading, isFetching, isError, error, refetch } = useGetActivityLogsQuery({});
  const logs = data ?? [];
  const [deleteLog] = useDeleteActivityLogMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="history" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Activity Logs</Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={logs.length === 0}
        emptyIcon="history"
        emptyLabel="No activity recorded yet"
      >
        {logs.map((log) => (
          <AccentListCard
            key={log._id}
            accent={colors.primary}
            avatar={<AvatarInitials name={log.user?.name} size={38} />}
            title={log.action}
            subtitle={`${log.user?.name ?? 'Unknown'} · ${timeAgo(log.createdAt)}`}
            meta={[
              ...(log.description ? [{ label: 'Description', value: log.description }] : []),
              ...(log.role?.name ? [{ label: 'Role', value: log.role.name }] : []),
              ...(log.school?.name ? [{ label: 'School', value: log.school.name }] : []),
            ]}
            expandable
            actions={canDelete ? <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={() => confirmDelete(() => deleteLog(log._id), 'this activity log')} /> : undefined}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

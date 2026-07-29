import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { FormField } from '../components/ui/FormField';
import { formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAuditLogFiltersQuery, useGetAuditLogsQuery } from '../store/api/apiSlice';

const STATUS_COLOR = { SUCCESS: '#22C55E', FAILED: '#EF4444', WARNING: '#F59E0B' };

/** System-wide audit trail — a separate, richer-filtered system distinct from the already-built
 * ActivityLogsScreen (ActivityLog model). Mirrors
 * frontend/src/pages/Super_Admin/System_Settings/AuditLogs.jsx's real (working) parts: search +
 * module/status/date filters + list. CSV export is deliberately not built (same reasoning as every
 * other deferred file download in this app), and there's no create/delete UI since audit entries
 * are written by other backend actions, not authored by a user. */
export function AuditLogsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtersQuery = useGetAuditLogFiltersQuery();
  const modules = filtersQuery.data?.modules ?? [];
  const statuses = filtersQuery.data?.statuses ?? [];

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      module: moduleFilter || undefined,
      status: statusFilter || undefined,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      limit: 50,
    }),
    [search, moduleFilter, statusFilter, startDate, endDate]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAuditLogsQuery(params);
  const logs = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="file-search-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Audit Logs</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            System-wide activity trail
          </Text>
        </View>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by actor / action / entity" style={{ marginBottom: spacing.sm }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        <Chip selected={!moduleFilter} onPress={() => setModuleFilter(null)}>
          All Modules
        </Chip>
        {modules.map((m) => (
          <Chip key={m} selected={m === moduleFilter} onPress={() => setModuleFilter(m)}>
            {m}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        <Chip selected={!statusFilter} onPress={() => setStatusFilter(null)}>
          All Statuses
        </Chip>
        {statuses.map((s) => (
          <Chip key={s} selected={s === statusFilter} onPress={() => setStatusFilter(s)}>
            {s}
          </Chip>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <FormField label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={{ flex: 1 }} />
        <FormField label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={{ flex: 1 }} />
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={logs.length === 0}
        emptyIcon="file-search-outline"
        emptyLabel="No audit log entries found"
      >
        {logs.map((log) => (
          <AccentListCard
            key={log._id}
            accent={STATUS_COLOR[log.status] || colors.primary}
            avatar={<AvatarInitials name={log.actorName} size={38} />}
            title={log.action}
            subtitle={`${log.actorName ?? 'Unknown'} · ${log.module ?? ''}`}
            badge={<StatusPill label={log.status ?? 'UNKNOWN'} color={STATUS_COLOR[log.status] || colors.textMuted} />}
            meta={[
              { label: 'Actor Email', value: log.actorEmail ?? '—' },
              ...(log.entityType ? [{ label: 'Entity Type', value: log.entityType }] : []),
              ...(log.entityId ? [{ label: 'Entity ID', value: log.entityId }] : []),
              ...(log.ipAddress ? [{ label: 'IP Address', value: log.ipAddress }] : []),
              { label: 'Timestamp', value: formatDate(log.createdAt) },
              ...(log.metadata ? [{ label: 'Metadata', value: JSON.stringify(log.metadata) }] : []),
            ]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

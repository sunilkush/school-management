import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { SearchField } from '../../components/ui/SearchField';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetDashboardSummaryQuery, useGetReportsQuery } from '../../store/api/apiSlice';

const TYPE_COLOR = { attendance: '#6366F1', exam: '#0EA5E9', result: '#10B981', academic: '#F59E0B', behaviour: '#EC4899' };

/** Read-only report list, mirrors web's TeacherReports.jsx exactly — a filtered view of the same
 * Report documents Super Admin's report builder writes (see SuperAdminReportsView.jsx's own
 * comment: it's a saved-blob CRUD, not a computation engine), scoped to reports this teacher
 * generated. No create/delete here — the web page doesn't offer them either. */
export function TeacherReportsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const summaryQuery = useGetDashboardSummaryQuery();
  const summary = summaryQuery.data ?? {};

  const { data, isLoading, isFetching, isError, error, refetch } = useGetReportsQuery(
    { sort: '-createdAt', school: user?.school?._id, generatedBy: user?._id },
    { skip: !user?._id }
  );
  const reports = data ?? [];

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => [r?.title, r?.type, r?.generatedBy?.name, r?.school?.name].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [reports, search]);

  return (
    <View>
      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Linked Students" metric={{ icon: 'school-outline', color: '#6366F1', value: summary.students ?? 0 }} />
          <StatCard label="Attendance Marked" metric={{ icon: 'clipboard-check-outline', color: '#0EA5E9', value: summary.attendanceMarked ?? 0 }} />
          <StatCard label="Reports Available" metric={{ icon: 'folder-open-outline', color: '#10B981', value: reports.length }} />
        </StatGrid>
      </View>

      {reports.length > 5 && (
        <SearchField value={search} onChangeText={setSearch} placeholder="Search title, type, creator…" style={{ marginBottom: spacing.md }} />
      )}

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filteredReports.length === 0}
        emptyIcon="chart-box-outline"
        emptyLabel={search ? `No reports match "${search}"` : 'No reports have been generated yet'}
      >
        {filteredReports.map((r) => (
          <AccentListCard
            key={r._id}
            accent={TYPE_COLOR[r.type] || colors.primary}
            avatar={<IconWell icon="file-chart-outline" color={TYPE_COLOR[r.type] || colors.primary} size={38} />}
            title={r.title || 'Untitled Report'}
            subtitle={r.generatedBy?.name ?? ''}
            badge={<StatusPill label={(r.type || 'unknown').toUpperCase()} color={TYPE_COLOR[r.type] || colors.textMuted} />}
            meta={[
              { label: 'Created', value: formatDate(r.createdAt) },
              { label: 'School', value: r.school?.name ?? '—' },
            ]}
            expandable
          />
        ))}
      </QueryState>
    </View>
  );
}

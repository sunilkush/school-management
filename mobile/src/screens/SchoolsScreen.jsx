import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { SchoolAccountRow } from './schools/SchoolAccountRow';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllSchoolsQuery } from '../store/api/apiSlice';

/** Mirrors frontend/src/pages/Super_Admin/School_Management/Schools.jsx. Registering a school
 * (multipart logo upload) and the subscription-management drawer (renew/suspend/change-plan) are
 * a separate, larger feature not built here — this covers the base directory: list, activate,
 * deactivate, delete. */
export function SchoolsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllSchoolsQuery({ search: search.trim() || undefined });
  const schools = data?.schools ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === null) return schools;
    return schools.filter((s) => s.isActive === (statusFilter === 'active'));
  }, [schools, statusFilter]);

  const boardTypeCount = useMemo(() => new Set(schools.flatMap((s) => (s.boards ?? []).map((b) => b.name))).size, [schools]);

  const stats = [
    { key: 'total', label: 'Total Schools', icon: 'domain', color: colors.primary, value: schools.length },
    { key: 'active', label: 'Active', icon: 'check-circle-outline', color: '#22C55E', value: schools.filter((s) => s.isActive).length },
    { key: 'inactive', label: 'Inactive', icon: 'close-circle-outline', color: '#EF4444', value: schools.filter((s) => !s.isActive).length },
    { key: 'boards', label: 'Board Types', icon: 'certificate-outline', color: '#7C3AED', value: boardTypeCount },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="domain" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Schools</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Every school on the platform
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
        <Chip selected={statusFilter === null} onPress={() => setStatusFilter(null)}>
          All
        </Chip>
        <Chip selected={statusFilter === 'active'} onPress={() => setStatusFilter('active')}>
          Active
        </Chip>
        <Chip selected={statusFilter === 'inactive'} onPress={() => setStatusFilter('inactive')}>
          Inactive
        </Chip>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search schools by name" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="domain-off"
        emptyLabel={search || statusFilter ? 'No schools match your filters' : 'No schools registered yet'}
      >
        {filtered.map((s) => (
          <SchoolAccountRow key={s._id} school={s} />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

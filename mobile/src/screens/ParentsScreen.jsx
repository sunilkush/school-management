import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { pillStyle, STATUS_SEMANTICS } from '../theme/patterns';
import { roleColor } from '../utils/roleColors';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllUsersQuery } from '../store/api/apiSlice';

export function ParentsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllUsersQuery({ roleName: 'Parent', academicYearId });
  const parents = data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parents;
    return parents.filter((p) => [p.name, p.email, p.phone].some((f) => f?.toLowerCase?.().includes(query)));
  }, [parents, search]);

  const stats = [
    { key: 'total', label: 'Total Parents', icon: 'account-child-outline', color: '#14B8A6', value: parents.length },
    { key: 'active', label: 'Active', icon: 'check-circle-outline', color: '#22C55E', value: parents.filter((p) => p.isActive).length },
    { key: 'showing', label: 'Showing', icon: 'eye-outline', color: colors.primary, value: filtered.length },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-child-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Parents Directory</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {user?.school?.name ?? 'School'}
            {user?.academicYear?.name ? ` · ${user.academicYear.name}` : ''}
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

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name, email or phone" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="account-child-outline"
        emptyLabel={search ? 'No parents match your search' : 'No parents found'}
      >
        {filtered.map((p) => (
          <AccentListCard
            key={p._id}
            accent={p.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
            avatar={<AvatarInitials name={p.name} size={40} />}
            title={p.name || 'Unnamed'}
            subtitle={p.email || 'No email'}
            badge={
              <View style={pillStyle(roleColor('Parent'))}>
                <Text style={[typography.caption, { color: roleColor('Parent'), fontWeight: '700', fontSize: 10.5 }]}>Parent</Text>
              </View>
            }
            meta={[{ label: 'Phone', value: p.phone }, { label: 'School', value: p.school?.name }]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

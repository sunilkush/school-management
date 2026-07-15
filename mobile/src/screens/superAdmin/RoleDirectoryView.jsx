import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { pillStyle, STATUS_SEMANTICS } from '../../theme/patterns';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAllUsersQuery } from '../../store/api/apiSlice';

/** Generic platform-wide (all-schools) role directory — reused for Super Admin's SchoolAdmins,
 * Accountants, Librarians and TransportUsers nav items. GET /user/all with no schoolId already
 * returns every matching user across every school for Super Admin (confirmed against the actual
 * controller), so this is a straight roleName filter, no per-school scoping needed. Takes up to 2
 * role names (only TransportUsers needs both — "Driver" and "Transporter") as 2 fixed hook calls
 * rather than mapping useGetAllUsersQuery over an array, which would violate the Rules of Hooks. */
export function RoleDirectoryView({ title, icon, roleNames }) {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');

  const query1 = useGetAllUsersQuery({ roleName: roleNames[0] });
  const query2 = useGetAllUsersQuery({ roleName: roleNames[1] }, { skip: !roleNames[1] });
  const queries = roleNames[1] ? [query1, query2] : [query1];

  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.isError)?.error;
  const refetchAll = () => queries.forEach((q) => q.refetch());

  const users = useMemo(() => {
    const all = queries.flatMap((q) => q.data ?? []);
    const seen = new Set();
    return all.filter((u) => {
      if (seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query1.data, query2.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => [u.name, u.email, u.school?.name].some((f) => f?.toLowerCase?.().includes(query)));
  }, [users, search]);

  const stats = [
    { key: 'total', label: 'Total', icon: 'account-group-outline', color: colors.primary, value: users.length },
    { key: 'active', label: 'Active', icon: 'check-circle-outline', color: '#22C55E', value: users.filter((u) => u.isActive).length },
    { key: 'schools', label: 'Schools', icon: 'domain', color: '#F59E0B', value: new Set(users.map((u) => u.school?._id).filter(Boolean)).size },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon={icon} color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Across all schools
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

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name, email or school" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetchAll}
        isEmpty={filtered.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel={search ? 'No matches for your search' : 'No users found'}
      >
        {filtered.map((u) => (
          <AccentListCard
            key={u._id}
            accent={u.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
            avatar={<AvatarInitials name={u.name} size={40} />}
            title={u.name || 'Unnamed'}
            subtitle={u.email || 'No email'}
            badge={
              u.school?.name ? (
                <View style={pillStyle(colors.primary)}>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 10.5 }]} numberOfLines={1}>
                    {u.school.name}
                  </Text>
                </View>
              ) : null
            }
            meta={[{ label: 'Phone', value: u.phone }]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

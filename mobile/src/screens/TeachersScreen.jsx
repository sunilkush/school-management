import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { pillStyle, STATUS_SEMANTICS } from '../theme/patterns';
import { roleColor } from '../utils/roleColors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllUsersQuery } from '../store/api/apiSlice';

// Student/Parent have their own dedicated directories elsewhere — this mirrors the web app's
// "Staff Directory" (frontend/.../User_Management/TeacherList.jsx), which is every OTHER role
// (Teacher, School Admin, Principal, Accountant, Librarian, ...), not literally just teachers.
const HIDDEN_ROLES = new Set(['student', 'parent']);

function RolePill({ label }) {
  const { typography } = useAppTheme();
  if (!label) return null;
  const color = roleColor(label);
  return (
    <View style={pillStyle(color)}>
      <Text style={[typography.caption, { color, fontWeight: '700', fontSize: 10.5 }]}>{label}</Text>
    </View>
  );
}

export function TeachersScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllUsersQuery({});
  const staff = useMemo(() => (data ?? []).filter((u) => !HIDDEN_ROLES.has(u.role?.name?.trim()?.toLowerCase())), [data]);

  const roleOptions = useMemo(() => {
    const seen = new Map();
    staff.forEach((u) => {
      const name = u.role?.name?.trim();
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    });
    return [...seen.values()];
  }, [staff]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((u) => {
      const matchesSearch = !query || [u.name, u.email, u.phone].some((f) => f?.toLowerCase?.().includes(query));
      const matchesRole = !selectedRole || u.role?.name?.trim()?.toLowerCase() === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, selectedRole]);

  const stats = [
    { key: 'total', label: 'Total Staff', icon: 'account-tie-outline', color: '#14B8A6', value: staff.length },
    { key: 'active', label: 'Active', icon: 'check-circle-outline', color: '#10B981', value: staff.filter((u) => u.isActive).length },
    { key: 'roles', label: 'Roles', icon: 'tag-outline', color: '#F59E0B', value: roleOptions.length },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-tie-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Staff Directory</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Manage teachers, admins and staff in one place
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
        <Chip selected={!selectedRole} onPress={() => setSelectedRole(null)}>
          All Roles
        </Chip>
        {roleOptions.map((name) => (
          <Chip key={name} selected={selectedRole === name.toLowerCase()} onPress={() => setSelectedRole(name.toLowerCase())}>
            {name}
          </Chip>
        ))}
      </ScrollView>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name, email or phone" style={{ marginTop: spacing.sm, marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel={search || selectedRole ? 'No staff match your filters' : 'No staff found'}
      >
        {filtered.map((u) => (
          <AccentListCard
            key={u._id}
            accent={u.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
            avatar={<AvatarInitials name={u.name} size={40} />}
            title={u.name || 'Unnamed'}
            subtitle={u.email || 'No email'}
            badge={<RolePill label={u.role?.name} />}
            meta={[{ label: 'Phone', value: u.phone }]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

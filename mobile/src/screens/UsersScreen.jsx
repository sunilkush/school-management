import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { IconWell } from '../components/ui/IconWell';
import { UserAccountRow } from './users/UserAccountRow';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllUsersQuery } from '../store/api/apiSlice';

// Real seeded roles this app models (mobile/src/constants/roles.js ROLE_NAMES), minus Super Admin
// itself — mirrors the web app's per-role hub pages (Admins/Teachers/Staff/Students/Parents/
// Accountant/Librarian/Transport), all thin wrappers over the same GET /user/all + roleName filter.
const ROLE_TABS = [
  'School Admin', 'Principal', 'Vice Principal', 'Teacher', 'Accountant',
  'Librarian', 'Hostel Warden', 'Transport Manager', 'Receptionist', 'Student', 'Parent',
];

/** Mirrors frontend/src/pages/Super_Admin/Users_Management/UserRoleList.jsx (and its per-role
 * wrapper pages). Registering/editing a user, and bulk activate/deactivate, are deferred — this
 * covers per-user activate/deactivate, the core account-status workflow. */
function UsersHub() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllUsersQuery({
    roleName: selectedRole || undefined,
    isActive: statusFilter === 'active',
  });
  const users = data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => [u.name, u.email].some((f) => f?.toLowerCase?.().includes(query)));
  }, [users, search]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-group-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Users</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Manage user accounts across every school
          </Text>
        </View>
      </View>

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        style={{ marginBottom: spacing.md }}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        <Chip selected={!selectedRole} onPress={() => setSelectedRole(null)}>
          All Roles
        </Chip>
        {ROLE_TABS.map((role) => (
          <Chip key={role} selected={role === selectedRole} onPress={() => setSelectedRole(role)}>
            {role}
          </Chip>
        ))}
      </ScrollView>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name or email" style={{ marginTop: spacing.sm, marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel={search || selectedRole ? 'No users match your filters' : 'No users found'}
      >
        {filtered.map((u) => (
          <UserAccountRow key={u._id} user={u} />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

// GET /user/all's role gate is ["Super Admin","School Admin","Accountant","Librarian",
// "Subject Coordinator","Exam Coordinator","Principal","Vice Principal"] — Receptionist has a
// "Users" nav item but isn't in that list, so it would 403 rather than render anything useful.
// A real fix needs a backend role-gate change (flagged separately); until then this shows an
// honest empty state instead of a raw API error.
const HUB_ROLES = new Set(['Super Admin']);

export function UsersScreen() {
  const { role } = useAuth();

  if (HUB_ROLES.has(role?.name)) return <UsersHub />;

  return (
    <ScreenContainer>
      <QueryState
        isLoading={false}
        isError={false}
        isEmpty
        emptyIcon="account-off-outline"
        emptyLabel="Users directory isn't available for this role yet"
      />
    </ScreenContainer>
  );
}

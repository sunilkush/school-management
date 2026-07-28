import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateRoleSheet } from './superAdmin/CreateRoleSheet';
import { GrantTempAccessSheet } from './superAdmin/GrantTempAccessSheet';
import { formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import {
  useDeleteRoleMutation,
  useDeleteTempAccessGrantMutation,
  useGetAllRolesQuery,
  useGetTempAccessGrantsQuery,
  useRevokeTempAccessGrantMutation,
} from '../store/api/apiSlice';

const GRANT_STATUS_COLOR = { Active: '#22C55E', Expired: '#94A3B8', Revoked: '#EF4444' };

/** Role CRUD (create + list + delete — the real web app itself has no edit UI, only a create form
 * embedded in this same page) plus Temporary Access grants, mirroring
 * frontend/src/pages/Super_Admin/System_Settings/Roles.jsx's single composite page. The web
 * page's "Role Templates" cards are purely decorative/local (no API call), not reproduced here. */
export function RolesScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creatingRole, setCreatingRole] = useState(false);
  const [granting, setGranting] = useState(false);

  const rolesQuery = useGetAllRolesQuery();
  const roles = rolesQuery.data ?? [];
  const [deleteRole, deleteRoleState] = useDeleteRoleMutation();

  const grantsQuery = useGetTempAccessGrantsQuery();
  const grants = grantsQuery.data ?? [];
  const [revokeGrant, revokeState] = useRevokeTempAccessGrantMutation();
  const [deleteGrant] = useDeleteTempAccessGrantMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="shield-account-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Roles</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreatingRole(true)}>
          New Role
        </Button>
      </View>

      <QueryState
        isLoading={rolesQuery.isLoading || rolesQuery.isFetching}
        isError={rolesQuery.isError}
        error={rolesQuery.error}
        onRetry={rolesQuery.refetch}
        isEmpty={roles.length === 0}
        emptyIcon="shield-account-outline"
        emptyLabel="No roles yet"
      >
        {roles.map((r) => (
          <AccentListCard
            key={r._id}
            accent={r.type === 'system' ? '#7C3AED' : colors.primary}
            avatar={<IconWell icon="shield-account-outline" color={r.type === 'system' ? '#7C3AED' : colors.primary} size={38} />}
            title={r.name}
            subtitle={r.schoolId?.name ?? (r.type === 'system' ? 'Global / Template' : '')}
            badge={<StatusPill label={r.type} color={r.type === 'system' ? '#7C3AED' : colors.textMuted} />}
            meta={[
              { label: 'Level', value: r.level },
              { label: 'Modules', value: (r.permissions ?? []).length },
              ...(r.description ? [{ label: 'Description', value: r.description }] : []),
            ]}
            expandable
            actions={
              r.type !== 'system' ? (
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteRoleState.isLoading} onPress={() => confirmDelete(() => deleteRole(r._id), 'this role')} />
              ) : null
            }
          />
        ))}
      </QueryState>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md }}>
        <Text style={[typography.h3, { color: colors.text }]}>Temporary Access</Text>
        <Button mode="contained-tonal" icon="clock-plus-outline" onPress={() => setGranting(true)}>
          Grant Access
        </Button>
      </View>

      <QueryState
        isLoading={grantsQuery.isLoading || grantsQuery.isFetching}
        isError={grantsQuery.isError}
        error={grantsQuery.error}
        onRetry={grantsQuery.refetch}
        isEmpty={grants.length === 0}
        emptyIcon="clock-outline"
        emptyLabel="No temporary access grants yet"
      >
        {grants.map((g) => (
          <AccentListCard
            key={g._id}
            accent={GRANT_STATUS_COLOR[g.status] || colors.primary}
            avatar={<IconWell icon="clock-outline" color={GRANT_STATUS_COLOR[g.status] || colors.primary} size={38} />}
            title={g.userId?.name ?? 'Unknown User'}
            subtitle={`${g.roleId?.name ?? 'Unknown Role'} · ${g.scope}`}
            badge={<StatusPill label={g.status} color={GRANT_STATUS_COLOR[g.status] || colors.textMuted} />}
            meta={[
              { label: 'Valid Till', value: formatDate(g.validTill) },
              { label: 'Reason', value: g.reason },
              { label: 'Granted By', value: g.grantedBy?.name ?? '—' },
            ]}
            expandable
            actions={
              <>
                {g.status === 'Active' && (
                  <Button size="small" mode="contained-tonal" compact onPress={() => revokeGrant(g._id)} loading={revokeState.isLoading} disabled={revokeState.isLoading}>
                    Revoke
                  </Button>
                )}
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={() => confirmDelete(() => deleteGrant(g._id), 'this access grant')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateRoleSheet visible={creatingRole} onDismiss={() => setCreatingRole(false)} onCreated={() => setCreatingRole(false)} />
      <GrantTempAccessSheet visible={granting} onDismiss={() => setGranting(false)} onCreated={() => setGranting(false)} />
    </ScreenContainer>
  );
}

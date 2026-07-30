import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { CreateRouteSheet } from './transport/CreateRouteSheet';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import { useDeleteTransportRouteMutation, useGetTransportRoutesQuery } from '../store/api/apiSlice';

// backend/src/routes/transport.routes.js TRANSPORT_MANAGE — Principal/VP/Accountant are
// TRANSPORT_READ only (view routes, no create/delete), so this screen is read-only for them.
const CAN_MANAGE_ROLES = new Set(['Super Admin', 'School Admin', 'Transport Manager']);

/** Mirrors frontend/src/pages/School_Admin/Transport/RoutesPage.jsx. Editing a route is deferred
 * (create + delete covers the core workflow). */
export function RoutesScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();
  const canManage = CAN_MANAGE_ROLES.has(role?.name);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetTransportRoutesQuery();
  const [deleteRoute, deleteState] = useDeleteTransportRouteMutation();
  const routes = data ?? [];

  const stats = [
    { key: 'total', label: 'Total Routes', icon: 'map-marker-path', color: colors.primary, value: routes.length },
    { key: 'students', label: 'Students Covered', icon: 'account-group-outline', color: '#14B8A6', value: routes.reduce((sum, r) => sum + (r.students || 0), 0) },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="map-marker-path" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Routes</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Transport routes for this school
          </Text>
        </View>
      </View>

      {canManage && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
          <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
            Add Route
          </Button>
        </View>
      )}

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={routes.length === 0}
        emptyIcon="map-marker-off-outline"
        emptyLabel="No routes added yet"
      >
        {routes.map((r) => (
          <AccentListCard
            key={r._id}
            accent={colors.primary}
            avatar={<IconWell icon="bus-school" color={colors.primary} size={38} />}
            title={r.name}
            subtitle={`Bus ${r.bus} · ${r.students ?? 0} students`}
            meta={[{ label: 'Stops', value: (r.stops ?? []).join(', ') || '—' }]}
            expandable
            actions={
              canManage ? (
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={18}
                  disabled={deleteState.isLoading}
                  onPress={() => confirmDelete(() => deleteRoute(r._id), 'this route')}
                />
              ) : undefined
            }
          />
        ))}
      </QueryState>

      {canManage && (
        <CreateRouteSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      )}
    </ScreenContainer>
  );
}

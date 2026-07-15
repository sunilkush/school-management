import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { Panel } from '../components/ui/Panel';
import { HIGH_RISK_ACTIONS } from '../constants/permissions';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllRolesQuery } from '../store/api/apiSlice';

/** Permission matrix + role diff — both 100% computed client-side from the same role list (no
 * dedicated backend endpoint), mirroring frontend's Permissions.jsx exactly. The web page's own
 * "Approval Queue"/"Audit Trail" panels are pure unpersisted local state with zero backend
 * contract — not reproduced here since they don't actually do anything on refresh. */
export function PermissionsScreen() {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllRolesQuery();
  const roles = data ?? [];

  const [baseRoleId, setBaseRoleId] = useState(null);
  const [compareRoleId, setCompareRoleId] = useState(null);

  const modules = useMemo(() => {
    const set = new Set();
    roles.forEach((r) => (r.permissions ?? []).forEach((p) => set.add(p.module)));
    return [...set].sort();
  }, [roles]);

  const hasAccess = (role, module) => (role.permissions ?? []).some((p) => p.module === module && p.actions?.length > 0);

  const diffRows = useMemo(() => {
    const baseRole = roles.find((r) => r._id === baseRoleId);
    const compareRole = roles.find((r) => r._id === compareRoleId);
    if (!baseRole || !compareRole) return [];

    const toMap = (role) => {
      const m = new Map();
      (role.permissions ?? []).forEach((p) => m.set(p.module, new Set(p.actions ?? [])));
      return m;
    };
    const baseMap = toMap(baseRole);
    const compareMap = toMap(compareRole);
    const unionModules = new Set([...baseMap.keys(), ...compareMap.keys()]);

    const rows = [];
    unionModules.forEach((module) => {
      const baseActions = baseMap.get(module) ?? new Set();
      const compareActions = compareMap.get(module) ?? new Set();
      const added = [...compareActions].filter((a) => !baseActions.has(a));
      const removed = [...baseActions].filter((a) => !compareActions.has(a));
      if (added.length || removed.length) {
        const highRisk = [...added, ...removed].some((a) => HIGH_RISK_ACTIONS.has(a));
        rows.push({ module, added, removed, highRisk });
      }
    });
    return rows;
  }, [roles, baseRoleId, compareRoleId]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="lock-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Permissions</Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={roles.length === 0}
        emptyIcon="lock-outline"
        emptyLabel="No roles found"
      >
        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Permission Matrix</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs, marginBottom: spacing.xs }}>
                <Text style={[typography.caption, { color: colors.textMuted, width: 110 }]}>MODULE</Text>
                {roles.map((r) => (
                  <Text key={r._id} style={[typography.caption, { color: colors.textMuted, width: 90, textAlign: 'center' }]} numberOfLines={1}>
                    {r.name}
                  </Text>
                ))}
              </View>
              {modules.map((module) => (
                <View key={module} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                  <Text style={[typography.body, { color: colors.text, width: 110 }]} numberOfLines={1}>
                    {module}
                  </Text>
                  {roles.map((r) => (
                    <Text
                      key={r._id}
                      style={{ width: 90, textAlign: 'center', color: hasAccess(r, module) ? '#22C55E' : '#EF4444', fontWeight: '700' }}
                    >
                      {hasAccess(r, module) ? '✓' : '✗'}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </Panel>

        <Panel style={{ marginBottom: 0 }}>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Compare Roles</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>BASE ROLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {roles.map((r) => (
              <Chip key={r._id} selected={r._id === baseRoleId} onPress={() => setBaseRoleId(r._id)}>
                {r.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>COMPARE TO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
            {roles.map((r) => (
              <Chip key={r._id} selected={r._id === compareRoleId} onPress={() => setCompareRoleId(r._id)}>
                {r.name}
              </Chip>
            ))}
          </ScrollView>

          {baseRoleId && compareRoleId && (
            <QueryState isLoading={false} isError={false} isEmpty={diffRows.length === 0} emptyIcon="check-circle-outline" emptyLabel="No differences between these two roles">
              {diffRows.map((row) => (
                <View key={row.module} style={{ borderRadius: radii.md, backgroundColor: row.highRisk ? '#FEE2E2' : colors.surfaceSoft, padding: spacing.sm, marginBottom: spacing.sm }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{row.module}</Text>
                  {row.added.length > 0 && (
                    <Text style={[typography.caption, { color: '#22C55E' }]}>+ {row.added.join(', ')}</Text>
                  )}
                  {row.removed.length > 0 && (
                    <Text style={[typography.caption, { color: '#EF4444' }]}>− {row.removed.join(', ')}</Text>
                  )}
                  {row.highRisk && <Text style={[typography.caption, { color: '#DC2626', fontWeight: '700' }]}>High-risk change</Text>}
                </View>
              ))}
            </QueryState>
          )}
        </Panel>
      </QueryState>
    </ScreenContainer>
  );
}

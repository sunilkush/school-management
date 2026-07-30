import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatusPill } from '../components/ui/StatusPill';
import { IconWell } from '../components/ui/IconWell';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const MODULE_ICON_KEYS = [
  ['user', 'account-outline'], ['employee', 'account-outline'], ['student', 'school-outline'],
  ['exam', 'clipboard-text-outline'], ['assessment', 'clipboard-text-outline'], ['class', 'book-open-variant'],
  ['subject', 'book-open-variant'], ['payroll', 'cash-multiple'], ['fee', 'cash-multiple'],
  ['transport', 'bus-school'], ['library', 'bookshelf'], ['report', 'chart-bar'],
  ['notification', 'bell-outline'], ['message', 'message-text-outline'], ['calendar', 'calendar-outline'],
  ['role', 'shield-account-outline'], ['permission', 'lock-outline'], ['task', 'checkbox-marked-outline'],
  ['document', 'file-document-outline'], ['inventory', 'package-variant-closed'], ['building', 'domain'],
  ['setting', 'wrench-outline'], ['database', 'database-outline'],
];

const iconForModule = (name = '') => {
  const lower = name.toLowerCase();
  const match = MODULE_ICON_KEYS.find(([key]) => lower.includes(key));
  return match ? match[1] : 'cog-outline';
};

const ACTION_COLOR_KEYS = [
  ['read', '#1D4ED8'], ['view', '#1D4ED8'], ['create', '#15803D'], ['add', '#15803D'],
  ['write', '#B45309'], ['update', '#B45309'], ['edit', '#B45309'], ['delete', '#DC2626'],
  ['remove', '#DC2626'], ['manage', '#6D28D9'], ['publish', '#0D9488'], ['approve', '#0D9488'],
  ['export', '#6D28D9'], ['import', '#1D4ED8'],
];

const colorForAction = (action = '') => {
  const lower = action.toLowerCase();
  const match = ACTION_COLOR_KEYS.find(([key]) => lower.includes(key));
  return match ? match[1] : '#475569';
};

/** Mirrors web's RoleWorkspace.jsx — a "what can I do" reference showing the signed-in user's own
 * granted modules/actions. Purely local: reads permissions straight off useAuth(), same as web
 * reads them off Redux's roleUi slice — no dedicated backend endpoint on either side. */
export function RoleWorkspaceView() {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user, role, permissions } = useAuth();

  const roleName = role?.name || 'User';
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = userName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const grouped = useMemo(() => {
    if (!Array.isArray(permissions)) return [];
    return permissions.map((item) => ({ module: item.module, actions: item.actions || [] }));
  }, [permissions]);

  const totalActions = grouped.reduce((sum, g) => sum + g.actions.length, 0);

  return (
    <ScreenContainer scrollable>
      <LinearGradient
        colors={[colors.primary, '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
          <View style={{
            width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20 }}>{initials}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }} numberOfLines={1}>{userName}</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 6,
              paddingHorizontal: 12, paddingVertical: 3, borderRadius: 99,
              backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{roleName}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[{ label: 'Modules', value: grouped.length }, { label: 'Permissions', value: totalActions }].map(({ label, value }) => (
              <View key={label} style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, minWidth: 64, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
              }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, lineHeight: 20 }}>{value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '500', marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>MODULE ACCESS</Text>

      <QueryState isLoading={false} isError={false} isEmpty={grouped.length === 0} emptyIcon="shield-off-outline" emptyLabel="No permissions assigned for this role yet">
        {grouped.map(({ module, actions }) => (
          <View
            key={module}
            style={{
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
              borderTopWidth: 3, borderTopColor: colors.primary, borderRadius: radii.lg,
              padding: spacing.md, marginBottom: spacing.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <IconWell icon={iconForModule(module)} color={colors.primary} size={38} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>{module}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{actions.length} permission{actions.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.borderMuted, marginBottom: spacing.sm }} />

            {actions.length === 0 ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>No actions mapped</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {actions.map((action) => (
                  <StatusPill key={action} label={action.toUpperCase()} color={colorForAction(action)} />
                ))}
              </View>
            )}
          </View>
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

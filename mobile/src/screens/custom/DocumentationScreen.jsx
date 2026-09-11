import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Divider, Icon, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Panel } from '../../components/ui/Panel';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { resolveRoleNav } from '../../navigation/resolveRoleNav';
import { screenForModule } from '../../navigation/screenForModule';
import { ModulePlaceholderScreen } from '../ModulePlaceholderScreen';

/**
 * In-app help: what this role can actually do *in the app*, right now.
 *
 * Built from the caller's own resolved navigation rather than a written manual, so it cannot drift
 * out of date — a module that gains a screen starts appearing here the same day, and one that has
 * not been built yet is listed as such instead of being quietly omitted.
 *
 * That last part is the point. A user who taps a menu entry and lands on a placeholder deserves to
 * know it is unbuilt rather than assume the app is broken or that they lack permission.
 */
export function DocumentationScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { user, role, permissions } = useAuth();

  const { ready, comingSoon } = useMemo(() => {
    const nav = resolveRoleNav(role?.name, permissions);
    // Flatten quick tabs, the "More" overflow and every group's children into one list.
    const flatten = (items) =>
      items.flatMap((item) => (item.isGroup ? item.children ?? [] : [item]));
    const all = [...flatten(nav.quickItems ?? []), ...flatten(nav.moreItems ?? [])];

    const seen = new Set();
    const unique = all.filter((item) => !seen.has(item.key) && seen.add(item.key));

    return {
      ready: unique.filter((item) => screenForModule(item) !== ModulePlaceholderScreen),
      comingSoon: unique.filter((item) => screenForModule(item) === ModulePlaceholderScreen),
    };
  }, [role?.name, permissions]);

  const Row = ({ item, muted }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
      <Icon source={item.icon ?? 'shape-outline'} size={20} color={muted ? colors.textMuted : colors.primary} />
      <Text style={[typography.body, { color: muted ? colors.textMuted : colors.text, flex: 1 }]}>
        {item.label ?? item.key}
      </Text>
    </View>
  );

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.h2, { color: colors.text }]}>Help</Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg }]}>
        Signed in as {user?.name ?? 'you'} · {role?.name ?? 'no role'}
      </Text>

      <Panel>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.xs }]}>
          What you can do here ({ready.length})
        </Text>
        <Divider style={{ backgroundColor: colors.borderMuted, marginBottom: spacing.xs }} />
        {ready.map((item) => (
          <Row key={item.key} item={item} />
        ))}
      </Panel>

      {comingSoon.length > 0 ? (
        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            In your menu, but not built yet ({comingSoon.length})
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.xs }]}>
            These open a placeholder. Nothing is broken and you are not missing a permission — the
            screen simply is not written yet. Use the web portal for these.
          </Text>
          <Divider style={{ backgroundColor: colors.borderMuted, marginBottom: spacing.xs }} />
          {comingSoon.map((item) => (
            <Row key={item.key} item={item} muted />
          ))}
        </Panel>
      ) : null}

      <Text style={[typography.caption, { color: colors.textMuted }]}>
        Anything you cannot find here is on the web portal, which has every module. If something
        looks wrong, raise a support ticket from the Support screen.
      </Text>
    </ScreenContainer>
  );
}

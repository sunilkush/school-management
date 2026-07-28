import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { SearchField } from '../../components/ui/SearchField';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { resolveRoleNav } from '../../navigation/resolveRoleNav';
import { navigateToNavItem } from '../../navigation/navigateToNavItem';

/** Flattens resolveRoleNav's built item tree (groups + flat leaves) into a single searchable
 * list — each leaf already carries its real .label/.icon from constants/roles.js's MODULE_META
 * (see resolveRoleNav.js's buildLeaf), so nothing here is guessed. */
function flattenNavItems(items) {
  const flat = [];
  for (const item of items) {
    if (item.isGroup) {
      (item.children ?? []).forEach((child) => {
        flat.push({ key: child.key, label: child.label, icon: child.icon, parent: item.title });
      });
    } else {
      flat.push({ key: item.key, label: item.label, icon: item.icon, parent: null });
    }
  }
  return flat;
}

/** Mirrors web's "All Modules" launcher (Super_Admin/Modules/Modules.jsx) — a searchable directory
 * of every destination the signed-in role has, for jumping straight to one instead of digging
 * through nested "More" groups. Web also shows a locked/greyed state for modules the role's
 * permissions don't grant, computed by flattening the RAW sidebar config and checking access
 * separately — not needed here, since resolveRoleNav's buildItems() already filters to only the
 * items this role/permission set actually has, so everything this screen lists is reachable. */
export function PlatformModulesView({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { role, permissions } = useAuth();
  const [search, setSearch] = useState('');

  const modules = useMemo(() => {
    const nav = resolveRoleNav(role?.name, permissions);
    return flattenNavItems(nav.items);
  }, [role?.name, permissions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) => [m.label, m.parent].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [modules, search]);

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total Modules" metric={{ icon: 'view-grid-outline', color: colors.primary, value: modules.length }} />
        </StatGrid>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search modules…" style={{ marginBottom: spacing.md }} />

      <QueryState
        isLoading={false}
        isError={false}
        isEmpty={filtered.length === 0}
        emptyIcon="view-grid-outline"
        emptyLabel={search ? `No modules match "${search}"` : 'No modules available'}
      >
        {filtered.map((m) => (
          <AccentListCard
            key={m.key}
            accent={colors.primary}
            avatar={<IconWell icon={m.icon} color={colors.primary} size={40} />}
            title={m.label}
            subtitle={m.parent || 'Dashboard'}
            onPress={() => navigateToNavItem(navigation, role?.name, permissions, m.key)}
          />
        ))}
      </QueryState>

      {filtered.length > 0 && (
        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
          {filtered.length} of {modules.length} modules
        </Text>
      )}
    </ScreenContainer>
  );
}

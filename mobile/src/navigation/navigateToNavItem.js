import { resolveRoleNav } from './resolveRoleNav';

/** Walks navigation.getParent() until there's no parent left — the actual root Tab.Navigator.
 * A single getParent() hop (what AppHeader's notification-bell fix originally did) only reaches
 * the immediate parent navigator, which is correct for a flat item tucked directly in "More" (one
 * navigator down from root) but wrong for an item nested inside a GROUP that's itself tucked in
 * "More" (two navigators down: Tab -> MoreMenuScreen's stack -> group's own GroupMenuScreen
 * stack) — the majority of real nav items once a role has more than a handful of destinations,
 * including virtually all of Super Admin's ~45 grouped items. Looping is the only depth-agnostic
 * way to reliably reach root regardless of how deep the calling screen happens to be nested. */
export function getRootTabNavigation(navigation) {
  let root = navigation;
  while (root.getParent?.()) root = root.getParent();
  return root;
}

/** Finds the navigate() path to `targetKey` within a resolved nav tree (quickItems or
 * moreItems): a 1-element path if it's a flat item, a 2-element [groupKey, targetKey] path if
 * it's nested inside a group's own GroupMenuScreen. Returns null if not found in that list. */
export function findNavPath(items, targetKey) {
  for (const item of items) {
    if (item.isGroup) {
      if ((item.children ?? []).some((c) => c.key === targetKey)) return [item.key, targetKey];
    } else if (item.key === targetKey) {
      return [targetKey];
    }
  }
  return null;
}

/** Navigates to any NAV_CONFIG destination by key, from anywhere in the app, regardless of the
 * calling screen's own nesting depth or whether the target is a quick tab, a flat "More" item, or
 * nested inside a group tucked in "More". */
export function navigateToNavItem(navigation, roleName, permissions, targetKey) {
  const root = getRootTabNavigation(navigation);
  const nav = resolveRoleNav(roleName, permissions);
  const inQuick = findNavPath(nav.quickItems, targetKey);
  const inMore = findNavPath(nav.moreItems, targetKey);

  if (inQuick) {
    if (inQuick.length === 1) root.navigate(inQuick[0]);
    else root.navigate(inQuick[0], { screen: inQuick[1] });
    return true;
  }
  if (inMore) {
    if (inMore.length === 1) root.navigate('More', { screen: inMore[0] });
    else root.navigate('More', { screen: inMore[0], params: { screen: inMore[1] } });
    return true;
  }
  return false;
}

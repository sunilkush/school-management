import { MODULE_META, NAV_CONFIG } from '../constants/roles';

// Notifications, Messages, Leave and Payroll are all gated by role NAME server-side (or not
// gated at all), never by the granular permissions array, so a permissions-array entry for them
// may not exist even for a role that's fully allowed — their nav visibility can't depend on one.
// (Payroll is still role-scoped: only the 8 roles that actually have "Payroll" in their own
// NAV_CONFIG.items below ever see it — this set only stops it being filtered out for those roles.)
const ALWAYS_VISIBLE = new Set(['Dashboard', 'Profile', 'Notifications', 'Messages', 'Leave', 'Payroll', 'Events']);

// Mirrors the web app's mobile BottomNav (frontend/src/components/mobile/BottomNav.jsx), which
// always shows at most 4 quick-access tabs + a 5th "Menu" overflow — never a side drawer. Only
// introduce the overflow ("more") bucket once a role actually has more destinations than fit.
const MAX_TABS_WITHOUT_OVERFLOW = 5;
const QUICK_TAB_COUNT = 4;

function grantedActionsFor(permissions, moduleName) {
  const entry = permissions?.find((p) => p.module === moduleName);
  return entry?.actions ?? [];
}

function metaFor(moduleKey) {
  return MODULE_META[moduleKey] ?? { label: moduleKey, icon: 'shape-outline' };
}

function isVisible(key, permissions, unrestricted, alwaysVisible) {
  return unrestricted || alwaysVisible.has(key) || grantedActionsFor(permissions, key).length > 0;
}

function buildLeaf(key, permissions) {
  return { key, module: key, actions: grantedActionsFor(permissions, key), ...metaFor(key) };
}

// A plain string entry is a leaf destination; `{ group, icon, items }` is a submenu — rendered as
// its own nested "folder" screen (GroupMenuScreen.jsx) so a role like Super Admin, whose web
// sidebar buries dozens of destinations behind ~10 group headers, gets the same grouped browsing
// experience on mobile instead of one very long flat list.
function buildItems(rawItems, permissions, unrestricted, alwaysVisible) {
  const built = [];
  for (const entry of rawItems) {
    if (typeof entry === 'string') {
      if (isVisible(entry, permissions, unrestricted, alwaysVisible)) built.push(buildLeaf(entry, permissions));
      continue;
    }
    const children = entry.items
      .filter((key) => isVisible(key, permissions, unrestricted, alwaysVisible))
      .map((key) => buildLeaf(key, permissions));
    if (children.length > 0) {
      built.push({ key: `group:${entry.group}`, isGroup: true, title: entry.group, icon: entry.icon, children });
    }
  }
  return built;
}

function splitQuickAndOverflow(items) {
  if (items.length <= MAX_TABS_WITHOUT_OVERFLOW) {
    return { quickItems: items, moreItems: [] };
  }
  return { quickItems: items.slice(0, QUICK_TAB_COUNT), moreItems: items.slice(QUICK_TAB_COUNT) };
}

/**
 * Turns (role name, granted permissions) into the ordered list of nav destinations this signed-in
 * user should actually see, split into `quickItems` (shown as direct bottom tabs) and `moreItems`
 * (only present once there are more destinations than fit in the tab bar — surfaced behind a
 * single "More" tab rather than a side drawer, matching the web app's own mobile nav pattern).
 *
 * Curated roles (the 11 named in the brief) use the hand-picked NAV_CONFIG list, still filtered
 * live against the user's own permissions — a School Admin who has since revoked a module from a
 * Teacher's role loses that tab immediately, no app update required. Any role NOT in NAV_CONFIG
 * (custom roles created in-app, or ones like "HR" that the backend doesn't reliably model with a
 * permissions template) gets a nav built directly from whatever modules that user's role actually
 * grants — so access still matches the permission system exactly, just without curated ordering.
 */
export function resolveRoleNav(roleName, permissions = []) {
  const config = NAV_CONFIG[roleName];

  if (config) {
    const alwaysVisible = new Set([...ALWAYS_VISIBLE, ...(config.alwaysVisibleExtra ?? [])]);
    const items = buildItems(config.items, permissions, config.unrestricted, alwaysVisible);

    return { items, ...splitQuickAndOverflow(items) };
  }

  // Fallback for roles the brief named but the backend doesn't seed a permissions template for
  // (e.g. "HR"), and for custom roles a School Admin creates from scratch.
  const moduleKeys = [...new Set((permissions ?? []).map((p) => p.module))].filter((key) => !ALWAYS_VISIBLE.has(key));
  const items = [
    { key: 'Dashboard', module: 'Dashboard', actions: [], ...metaFor('Dashboard') },
    ...moduleKeys.map((key) => ({ key, module: key, actions: grantedActionsFor(permissions, key), ...metaFor(key) })),
    { key: 'Notifications', module: 'Notifications', actions: [], ...metaFor('Notifications') },
    { key: 'Profile', module: 'Profile', actions: [], ...metaFor('Profile') },
  ];

  return { items, ...splitQuickAndOverflow(items) };
}

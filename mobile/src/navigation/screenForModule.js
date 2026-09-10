import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GroupMenuScreen } from '../screens/GroupMenuScreen';
import { ModulePlaceholderScreen } from '../screens/ModulePlaceholderScreen';
import { MODULE_REGISTRY } from '../modules/registry';

/**
 * Screens whose UI is genuinely not a list/detail/form over one resource, so they can't be
 * expressed as a registry descriptor. Keep this map small — every entry here is a file someone
 * has to maintain by hand. Expected final size is ~15 (dashboards, mark-attendance, exam player,
 * bus map, fee payment, timetable grid, report card viewer, chat, driver trip).
 */
const CUSTOM_SCREENS = {
  Dashboard: DashboardScreen,
  Profile: ProfileScreen,
};

// Screens that are themselves a nested navigator (Profile pushes to Settings) and so render their
// own header — the outer Tab/Stack must not also show one, or the user sees two stacked headers.
export const SELF_HEADERED_KEYS = new Set(['Profile']);

/** True for anything rendering its own nested Stack.Navigator — the named screens above, every
 * submenu group (GroupMenuScreen), and any registry module that gained a detail or form screen
 * and so became its own stack (createModuleScreen stamps `selfHeadered` on what it returns). */
export function isSelfHeadered(item) {
  if (item.isGroup || SELF_HEADERED_KEYS.has(item.key)) return true;
  return Boolean(MODULE_REGISTRY[item.key]?.screen?.selfHeadered);
}

/**
 * Resolves a nav item to the component that renders it, in priority order:
 *   1. a group  -> GroupMenuScreen (its own submenu stack)
 *   2. a bespoke screen registered above
 *   3. a declarative descriptor carrying its own screen (modules/registry.js)
 *   4. ModulePlaceholderScreen — always safe, shows the module and its granted actions
 *
 * Step 4 is why a role's navigation is complete from Phase 1 onward even though most modules
 * aren't built: tapping any destination lands somewhere honest instead of crashing.
 */
export function screenForModule(item) {
  if (item.isGroup) return GroupMenuScreen;

  const custom = CUSTOM_SCREENS[item.key];
  if (custom) return custom;

  const descriptor = MODULE_REGISTRY[item.key];
  if (descriptor?.screen) return descriptor.screen;

  return ModulePlaceholderScreen;
}

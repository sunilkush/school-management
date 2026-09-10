import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { setThemeMode } from '../store/slices/uiSlice';
import { useGetActiveAcademicYearQuery, useGetNotificationsQuery } from '../store/api/apiSlice';
import { navigateToNavItem } from './navigateToNavItem';

const THEME_CYCLE = ['system', 'light', 'dark'];
const THEME_ICON = { system: 'theme-light-dark', light: 'white-balance-sunny', dark: 'moon-waning-crescent' };

// Nested/pushed screens (Settings, Profile's own landing screen, the More overflow list) never
// get an `icon` route param — only entries built from a nav item (screenForModule) do.
const FALLBACK_ICONS = {
  Settings: 'cog-outline',
  ProfileMain: 'account-outline',
  MoreMenuList: 'dots-horizontal',
  HomeworkMain: 'clipboard-text-outline',
  HomeworkSubmissions: 'clipboard-text-outline',
  MessagesInbox: 'email-outline',
  MessageThread: 'email-outline',
  ComposeMessage: 'email-plus-outline',
  StudentListMain: 'school-outline',
  StudentDetails: 'account-outline',
};

// Every role in constants/roles.js nests 'Notifications' inside a { group: 'Communication',
// items: [...] } block — it is never a bare top-level NAV_CONFIG item for any of the 12 curated
// roles. See navigateToNavItem.js for why this needs a root-navigator walk, not a single
// getParent() hop, to work correctly from screens nested inside a group tucked in "More".

/** Custom header for every authenticated screen — page icon + title on the left, Academic Year /
 * theme toggle / notification bell on the right. Mirrors the web app's Topbar (frontend/src/
 * components/navbar/Topbar.jsx): AcademicYearSwitcher + theme Dropdown + NotificationDropdown. */
export function AppHeader({ navigation, route, options, back }) {
  const { colors, typography, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { user, role, permissions } = useAuth();
  const themeMode = useSelector((state) => state.ui.themeMode);
  const { data: notifications } = useGetNotificationsQuery();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const { data: activeYear } = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;
  const icon = route.params?.icon ?? FALLBACK_ICONS[route.name] ?? 'circle-outline';
  const title = options.title ?? route.name;
  const academicYearLabel = activeYear?.name;

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themeMode) + 1) % THEME_CYCLE.length];
    dispatch(setThemeMode(next));
  };

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm }}>
        {back ? (
          <Pressable onPress={navigation.goBack} hitSlop={8} style={{ marginRight: -spacing.xs }}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
          </Pressable>
        ) : null}

        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${colors.primary}18`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
        </View>

        <Text style={[typography.h3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {title}
        </Text>

        {academicYearLabel ? (
          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, maxWidth: 92 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }} numberOfLines={1}>
              {academicYearLabel}
            </Text>
          </View>
        ) : null}

        <Pressable onPress={cycleTheme} hitSlop={8}>
          <MaterialCommunityIcons name={THEME_ICON[themeMode]} size={22} color={colors.textSecondary} />
        </Pressable>

        <Pressable onPress={() => navigateToNavItem(navigation, role?.name, permissions, 'Notifications')} hitSlop={8} style={{ position: 'relative' }}>
          <MaterialCommunityIcons name={unreadCount > 0 ? 'bell' : 'bell-outline'} size={22} color={colors.textSecondary} />
          {unreadCount > 0 && (
            <Badge size={14} style={{ position: 'absolute', top: -4, right: -6, backgroundColor: colors.danger }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Pressable>
      </View>
    </View>
  );
}

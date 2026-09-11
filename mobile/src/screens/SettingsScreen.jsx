import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { StatusPill } from '../components/ui/StatusPill';
import { IconWell } from '../components/ui/IconWell';
import { Panel } from '../components/ui/Panel';
import { useAppTheme } from '../theme/ThemeProvider';
import { setThemeMode } from '../store/slices/uiSlice';
import { APP_NAME } from '../constants/config';
import { getNotifications, isExpoGo } from '../utils/pushNotifications';

// Under Expo Go there is no notifications module to ask — importing it there is fatal on its own
// (see utils/pushNotifications.js), so the permission reports as unavailable rather than as denied,
// which would send someone into Android settings to fix something that is not broken.
function useNotificationPermission() {
  const [status, setStatus] = useState(isExpoGo ? 'unavailable' : 'unknown');

  useEffect(() => {
    const notifications = getNotifications();
    if (!notifications) return;
    notifications.getPermissionsAsync().then((result) => setStatus(result.status));
  }, []);

  const request = async () => {
    const notifications = getNotifications();
    if (!notifications) return;
    const result = await notifications.requestPermissionsAsync();
    setStatus(result.status);
  };

  return { status, request };
}

// Web's SettingsPage.jsx bundles Profile/Password/Preferences/Backup into one tabbed page —
// mobile already splits Profile editing + password change into their own ProfileScreen.jsx (a
// standard mobile pattern, a dedicated tab rather than a settings sub-tab), so this screen covers
// what's left: the two genuinely device/app-level preferences (theme, push notification
// permission) that only exist as concepts on a native client, not a school-config concern.
export function SettingsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.themeMode);
  const notificationPermission = useNotificationPermission();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cog-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Settings</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            App appearance and notification preferences
          </Text>
        </View>
      </View>

      <Panel>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>APPEARANCE</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {['system', 'light', 'dark'].map((mode) => (
            <Button
              key={mode}
              mode={themeMode === mode ? 'contained' : 'outlined'}
              onPress={() => dispatch(setThemeMode(mode))}
              compact
              style={{ flex: 1 }}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </View>
      </Panel>

      <Panel>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>NOTIFICATIONS</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill
            label={
              notificationPermission.status === 'granted'
                ? 'Enabled'
                : notificationPermission.status === 'unavailable'
                  ? 'Not available'
                  : 'Disabled'
            }
            color={notificationPermission.status === 'granted' ? colors.success : colors.textMuted}
          />
          {/* No Enable button under Expo Go — it could not do anything, and a button that does
              nothing is worse than none. */}
          {notificationPermission.status !== 'granted' && notificationPermission.status !== 'unavailable' && (
            <Button mode="outlined" onPress={notificationPermission.request} compact>
              Enable
            </Button>
          )}
        </View>
        {notificationPermission.status === 'unavailable' && (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
            Expo Go cannot receive push notifications. Install a development build to use them.
          </Text>
        )}
      </Panel>

      <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {APP_NAME} · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

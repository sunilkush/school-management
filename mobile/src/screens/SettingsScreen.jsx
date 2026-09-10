import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { StatusPill } from '../components/ui/StatusPill';
import { IconWell } from '../components/ui/IconWell';
import { Panel } from '../components/ui/Panel';
import { useAppTheme } from '../theme/ThemeProvider';
import { setThemeMode } from '../store/slices/uiSlice';
import { APP_NAME } from '../constants/config';

function useNotificationPermission() {
  const [status, setStatus] = useState('unknown');

  const check = async () => {
    const result = await Notifications.getPermissionsAsync();
    setStatus(result.status);
  };

  useEffect(() => {
    check();
  }, []);

  const request = async () => {
    const result = await Notifications.requestPermissionsAsync();
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
            label={notificationPermission.status === 'granted' ? 'Enabled' : 'Disabled'}
            color={notificationPermission.status === 'granted' ? colors.success : colors.textMuted}
          />
          {notificationPermission.status !== 'granted' && (
            <Button mode="outlined" onPress={notificationPermission.request} compact>
              Enable
            </Button>
          )}
        </View>
      </Panel>

      <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {APP_NAME} · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

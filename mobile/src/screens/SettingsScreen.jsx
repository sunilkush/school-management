import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { StatusPill } from '../components/ui/StatusPill';
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

export function SettingsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.themeMode);
  const notificationPermission = useNotificationPermission();

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>APPEARANCE</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
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

      <Divider />

      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.xs }]}>
        NOTIFICATIONS
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
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

      <Divider />

      <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {APP_NAME} · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

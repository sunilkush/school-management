import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Divider, Snackbar, Text } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { FormField } from '../components/ui/FormField';
import { StatusPill } from '../components/ui/StatusPill';
import { useAppTheme } from '../theme/ThemeProvider';
import { setThemeMode } from '../store/slices/uiSlice';
import { useChangePasswordMutation } from '../store/api/apiSlice';
import { validatePassword } from '../utils/validators';
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

  const [changePassword, changePasswordState] = useChangePasswordMutation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState(null);

  const handleChangePassword = async () => {
    const errors = {
      oldPassword: !oldPassword ? 'Current password is required' : null,
      newPassword: validatePassword(newPassword),
      confirmPassword: confirmPassword !== newPassword ? 'Passwords do not match' : null,
    };
    setFieldErrors(errors);
    if (errors.oldPassword || errors.newPassword || errors.confirmPassword) return;

    try {
      await changePassword({ oldPassword, newPassword }).unwrap();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSnackbar({ message: 'Password changed successfully', isError: false });
    } catch (err) {
      setSnackbar({ message: err?.message || 'Failed to change password', isError: true });
    }
  };

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

      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.xs }]}>
        CHANGE PASSWORD
      </Text>
      <FormField
        label="Current Password"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        autoCapitalize="none"
        error={fieldErrors.oldPassword}
        disabled={changePasswordState.isLoading}
      />
      <FormField
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        error={fieldErrors.newPassword}
        disabled={changePasswordState.isLoading}
      />
      <FormField
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        error={fieldErrors.confirmPassword}
        disabled={changePasswordState.isLoading}
      />
      <Button mode="contained" onPress={handleChangePassword} loading={changePasswordState.isLoading} disabled={changePasswordState.isLoading} style={{ marginTop: spacing.sm }}>
        Update Password
      </Button>

      <Divider style={{ marginTop: spacing.xl }} />

      <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {APP_NAME} · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)} duration={3000} style={snackbar?.isError ? { backgroundColor: colors.danger } : undefined}>
        {snackbar?.message}
      </Snackbar>
    </ScreenContainer>
  );
}

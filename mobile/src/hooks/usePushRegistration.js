import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useAuth } from './useAuth';
import { useRegisterDeviceTokenMutation, useUnregisterDeviceTokenMutation } from '../store/api/apiSlice';

/**
 * Registers this device for push on sign-in, unregisters on sign-out. Uses the native FCM/APNs
 * device token (getDevicePushTokenAsync) rather than Expo's push-relay token, per the decision to
 * integrate FCM/APNs directly instead of Expo's push service — so this requires a development or
 * production build. Expo Go (SDK 53+) removed remote push entirely, and calling
 * getDevicePushTokenAsync there doesn't just reject the promise — expo-notifications logs its own
 * console.error internally first, which Expo Go's LogBox surfaces as a full red-screen overlay
 * regardless of the try/catch below. Skip the whole path under Expo Go so that never fires.
 */
export function usePushRegistration() {
  const { isAuthenticated } = useAuth();
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();
  const [unregisterDeviceToken] = useUnregisterDeviceTokenMutation();
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return undefined;
    let cancelled = false;

    (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        const finalStatus =
          existingStatus === 'granted' ? existingStatus : (await Notifications.requestPermissionsAsync()).status;
        if (finalStatus !== 'granted' || cancelled) return;

        const { data: token } = await Notifications.getDevicePushTokenAsync();
        if (!token || cancelled) return;

        tokenRef.current = token;
        await registerDeviceToken({ token, platform: Platform.OS }).unwrap();
      } catch (error) {
        console.warn('[push] registration skipped:', error?.message || error);
      }
    })();

    return () => {
      cancelled = true;
      if (tokenRef.current) {
        unregisterDeviceToken({ token: tokenRef.current }).catch(() => {});
        tokenRef.current = null;
      }
    };
  }, [isAuthenticated, registerDeviceToken, unregisterDeviceToken]);
}

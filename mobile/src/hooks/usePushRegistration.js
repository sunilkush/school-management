import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useAuth } from './useAuth';
import { useRegisterDeviceTokenMutation, useUnregisterDeviceTokenMutation } from '../store/api/apiSlice';
import { navigationRef } from '../navigation/navigationRef';
import { navigateToNavItem } from '../navigation/navigateToNavItem';

// Without this, a push that arrives while the app is in the foreground is delivered to JS but
// never surfaced — expo-notifications only auto-presents a system notification for background/
// killed states, so foreground pushes silently vanished. Must be set at module scope (runs once
// on import, before RootNavigator mounts) rather than inside the hook's effect, since a push can
// arrive at any time the app is open, not just while this hook's effect is active.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const { isAuthenticated, role, permissions } = useAuth();
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
          // DEFAULT importance only drops the notification into the shade silently — Android
          // requires HIGH/MAX for a heads-up banner, which is what "push notification" means to
          // a user. This was the other half of why pushes appeared to not be working on Android.
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
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

  // Routes a tapped push to the Notifications screen — every push this app sends originates from
  // the Notification model (see notification.controllers.js's sendPushToUsers call), so that's the
  // one real "deep link" destination that matters, not a per-notification-type path. Covers both
  // ways a tap can reach the app: already running (the live listener) and cold-started by the tap
  // itself (getLastNotificationResponseAsync, checked once on mount). Uses navigationRef instead of
  // a screen's own `navigation` prop since this listener lives outside the component tree and can
  // fire before any screen has mounted.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const routeToNotifications = () => {
      if (!navigationRef.isReady()) return;
      navigateToNavItem(navigationRef, role?.name, permissions, 'Notifications');
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) routeToNotifications();
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(routeToNotifications);
    return () => subscription.remove();
  }, [isAuthenticated, role?.name, permissions]);
}

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { useRegisterDeviceTokenMutation, useUnregisterDeviceTokenMutation } from '../store/api/apiSlice';
import { navigationRef } from '../navigation/navigationRef';
import { navigateToNavItem } from '../navigation/navigateToNavItem';
import { getNotifications } from '../utils/pushNotifications';

// Without this, a push that arrives while the app is in the foreground is delivered to JS but
// never surfaced — expo-notifications only auto-presents a system notification for background/
// killed states, so foreground pushes silently vanish. It runs once at module scope rather than
// inside the hook's effect because a push can arrive any time the app is open, not just while the
// effect is active.
//
// `getNotifications()` returns null under Expo Go, and this whole block is skipped there. It has
// to be a lazy require, not a static import: in SDK 57 importing expo-notifications inside Expo Go
// is fatal on its own — see utils/pushNotifications.js.
const notifications = getNotifications();
if (notifications) {
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Registers this device for push on sign-in, unregisters on sign-out. Uses the native FCM/APNs
 * device token (getDevicePushTokenAsync) rather than Expo's push-relay token, per the decision to
 * integrate FCM/APNs directly instead of Expo's push service — so this requires a development or
 * production build.
 *
 * Under Expo Go the hook does nothing at all, because expo-notifications is not even loaded there.
 */
export function usePushRegistration() {
  const { isAuthenticated, role, permissions } = useAuth();
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();
  const [unregisterDeviceToken] = useUnregisterDeviceTokenMutation();
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    if (!notifications) return undefined;
    let cancelled = false;

    (async () => {
      try {
        if (Platform.OS === 'android') {
          // DEFAULT importance only drops the notification into the shade silently — Android
          // requires HIGH/MAX for a heads-up banner, which is what "push notification" means to
          // a user. This was the other half of why pushes appeared to not be working on Android.
          await notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const { status: existingStatus } = await notifications.getPermissionsAsync();
        const finalStatus =
          existingStatus === 'granted' ? existingStatus : (await notifications.requestPermissionsAsync()).status;
        if (finalStatus !== 'granted' || cancelled) return;

        const { data: token } = await notifications.getDevicePushTokenAsync();
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
    // Same guard as above: there is no notifications module to listen on under Expo Go.
    if (!notifications) return undefined;

    const routeToNotifications = () => {
      if (!navigationRef.isReady()) return;
      navigateToNavItem(navigationRef, role?.name, permissions, 'Notifications');
    };

    notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) routeToNotifications();
    });

    const subscription = notifications.addNotificationResponseReceivedListener(routeToNotifications);
    return () => subscription.remove();
  }, [isAuthenticated, role?.name, permissions]);
}

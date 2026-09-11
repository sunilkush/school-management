import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when running inside the Expo Go client rather than a development or production build.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * `expo-notifications`, or `null` under Expo Go.
 *
 * **This must never be a static `import` anywhere in the app.** As of SDK 53 Expo Go has no remote
 * push support, and in SDK 57 merely *importing* the module is fatal there: its
 * `DevicePushTokenAutoRegistration` side-effect file runs at import time, calls
 * `addPushTokenListener`, and that now throws rather than warning. The result is a red
 * "[runtime not ready]" screen before the app renders a single pixel — no try/catch around the
 * call sites helps, because nothing of ours has run yet.
 *
 * So the module is pulled in lazily, and only where it is genuinely usable. Everything
 * notification-related has to cope with getting `null` back.
 */
let cached = null;
export function getNotifications() {
  if (isExpoGo) return null;
  if (!cached) {
    // eslint-disable-next-line global-require
    cached = require('expo-notifications');
  }
  return cached;
}

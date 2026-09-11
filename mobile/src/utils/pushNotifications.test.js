import fs from 'fs';
import path from 'path';

/**
 * A device-only crash that no amount of bundling or unit testing caught: in SDK 57, merely
 * IMPORTING expo-notifications inside Expo Go throws at module load — its
 * DevicePushTokenAutoRegistration side effect calls addPushTokenListener, which now raises instead
 * of warning. The app died on a red "[runtime not ready]" screen before rendering anything.
 *
 * The fix is a lazy require behind an Expo Go check (utils/pushNotifications.js). This test guards
 * it, because a static `import * as Notifications from 'expo-notifications'` is the obvious thing
 * for the next person to write, and it would break the app for every Expo Go user again.
 */
function sourceFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') sourceFiles(full, found);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

describe('expo-notifications must never be imported statically', () => {
  it('has no static import of expo-notifications outside the lazy loader', () => {
    const offenders = sourceFiles(path.join(__dirname, '..'))
      .filter((file) => path.basename(file) !== 'pushNotifications.js')
      .filter((file) => /^\s*import[^;]*from\s+['"]expo-notifications['"]/m.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(path.join(__dirname, '..'), file));

    expect(offenders).toEqual([]);
  });

  it('only the lazy loader requires it, and only outside Expo Go', () => {
    const loader = fs.readFileSync(path.join(__dirname, 'pushNotifications.js'), 'utf8');
    expect(loader).toMatch(/require\('expo-notifications'\)/);
    // The guard has to come before the require, or the lazy loading buys nothing.
    expect(loader.indexOf('if (isExpoGo) return null;')).toBeLessThan(loader.indexOf("require('expo-notifications')"));
  });
});

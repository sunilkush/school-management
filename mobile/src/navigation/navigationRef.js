import { createNavigationContainerRef } from '@react-navigation/native';

/** Lets code outside the component tree (the push-notification tap handler in
 * usePushRegistration.js, which fires from a listener callback, not a screen) navigate without a
 * `navigation` prop — the standard React Navigation pattern for this. Attached to
 * NavigationContainer's own `ref` in RootNavigator.jsx. Already sits at the root, so
 * navigateToNavItem.js's getRootTabNavigation() walk (`while (root.getParent?.())`) terminates
 * immediately here — no parent above the container ref — same as if it were called from any
 * screen already at the top of the tree. */
export const navigationRef = createNavigationContainerRef();

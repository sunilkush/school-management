import { Alert } from 'react-native';

/** Wraps a destructive action in a native "are you sure?" confirmation. Delete buttons across the
 * app previously fired their mutation the instant the icon was tapped — a single mistap
 * permanently destroyed the record with no undo. Only used for hard deletes, not status changes
 * (reject/cancel/archive already show their own reason/outcome before submitting).
 *
 * Doesn't handle failure itself — store/errorMiddleware.js is a global safety net that alerts on
 * any rejected mutation (this one included), so duplicating that here would double-alert. */
export function confirmDelete(action, itemLabel = 'this item') {
  Alert.alert('Delete', `Delete ${itemLabel}? This cannot be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: action },
  ]);
}

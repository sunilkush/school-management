import { isRejectedWithValue } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

// Verified against RTK Query's own source (buildInitiateMutation in
// @reduxjs/toolkit/dist/query/rtk-query.legacy-esm.js): every mutation thunk's meta.arg.type is
// literally "mutation" (queries are "query"), and a failed mutation's action.payload is exactly
// what axiosBaseQuery.js's catch block returns — { status, message } — since RTK Query calls
// rejectWithValue(transformedErrorResponse) with our baseQuery's own error object, unmodified.
//
/** Global safety net for failed mutations. Most one-tap action buttons across the app (approve,
 * reject, activate, resolve, mark-exit, delete, ...) call their RTK Query mutation trigger
 * directly with no .unwrap()/try-catch and no local error state — until this middleware, a failed
 * one of those (permission denied, a backend business-rule rejection, a dropped connection) gave
 * the user zero feedback; the row would just silently stay put with no explanation. This does not
 * fire for failed queries (those already have their own isError/QueryState retry banners), and a
 * handful of Create/Update sheets that already show a friendlier inline error via their own
 * .unwrap()+try/catch will now also see this alert — a redundant-but-visible message is still
 * strictly better than the silent failures this closes everywhere else. */
export const rtkMutationErrorMiddleware = () => (next) => (action) => {
  // A 401 here means client.js's refresh-token flow already failed and dispatched
  // sessionExpired() (see store/index.js), which redirects to Login — that redirect is itself
  // the user-facing signal. Alerting "Action Failed" on top of it would misattribute an
  // auth-expiry to whatever button they happened to tap.
  if (isRejectedWithValue(action) && action.meta?.arg?.type === 'mutation' && action.payload?.status !== 401) {
    Alert.alert('Action Failed', action.payload?.message || 'Something went wrong. Please try again.');
  }
  return next(action);
};

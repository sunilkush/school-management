import { combineReducers, configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { apiSlice } from './api/apiSlice';
import { setSessionExpiredHandler } from '../api/client';
import { sessionExpired } from './slices/authSlice';
import { rtkMutationErrorMiddleware } from './errorMiddleware';

// Only the UI preference and a non-sensitive snapshot of the signed-in user persist across
// launches — access/refresh tokens live exclusively in SecureStore (see utils/secureStorage.js),
// never in this store or AsyncStorage. `status`/`error` are blacklisted so every launch re-runs
// bootstrapSession() against the API instead of trusting a stale persisted status.
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  blacklist: ['status', 'error'],
};

// Only `queries` (the actual cached response data) is persisted — `mutations`, `subscriptions`,
// `config`, and `provided` are transient bookkeeping that must always start fresh, or a persisted
// "0 subscribers" ghost entry can prevent a screen mounting after relaunch from ever refetching it.
const apiPersistConfig = {
  key: 'api',
  storage: AsyncStorage,
  whitelist: ['queries'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: uiReducer,
  [apiSlice.reducerPath]: persistReducer(apiPersistConfig, apiSlice.reducer),
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware, rtkMutationErrorMiddleware),
});

export const persistor = persistStore(store);

setSessionExpiredHandler(() => store.dispatch(sessionExpired()));

import React from 'react';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render } from '@testing-library/react-native';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';
import { apiSlice } from '../store/api/apiSlice';
import { AppThemeProvider } from '../theme/ThemeProvider';

/**
 * A real (unpersisted) store for component tests — same reducers as the app, no redux-persist and
 * no AsyncStorage/SecureStore side effects, so a component under test can dispatch real thunks and
 * read real derived state instead of everything being mocked.
 */
// react-native-safe-area-context needs a real onLayout measurement to populate insets, which
// never fires under the test renderer — `initialWindowMetrics` is null in Jest for the same
// reason, so SafeAreaProvider renders nothing without an explicit mock (the pattern the library's
// own docs recommend for tests).
const MOCK_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function createTestStore(preloadedState) {
  return configureStore({
    reducer: combineReducers({
      auth: authReducer,
      ui: uiReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
  });
}

// @testing-library/react-native v14's `render` is async (it awaits an `act()` around the initial
// render), so this must be awaited too — spreading an un-awaited render() spreads a pending
// Promise instead of the render result, leaving the `screen` singleton never actually set.
export async function renderWithProviders(ui, { preloadedState, store = createTestStore(preloadedState) } = {}) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <SafeAreaProvider initialMetrics={MOCK_SAFE_AREA_METRICS}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </SafeAreaProvider>
      </Provider>
    );
  }

  const result = await render(ui, { wrapper: Wrapper });
  return { store, ...result };
}

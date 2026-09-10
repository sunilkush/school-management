import React from 'react';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';
import { apiSlice } from '../store/api/apiSlice';
import { AppThemeProvider } from '../theme/ThemeProvider';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

/** Same shape as the real store (src/store/index.js) minus redux-persist — tests don't need
 * rehydration, and skipping it avoids pulling AsyncStorage into every screen smoke test. */
export function makeTestStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

const TEACHER_ROLE = { name: 'Teacher', permissions: [] };
const DEFAULT_USER = { _id: 'test-user', name: 'Test User', role: TEACHER_ROLE, school: { _id: 'test-school', name: 'Test School' } };

/** Renders `ui` inside a real (but network-mocked, see api/__mocks__/client.js) Redux store and
 * the app's theme provider — the same two providers every screen actually depends on. Pass
 * `authState` to override the signed-in user/role for role-branching screens. */
export async function renderWithProviders(ui, { authState, ...renderOptions } = {}) {
  const preloadedState = {
    auth: {
      status: 'authenticated',
      user: DEFAULT_USER,
      role: TEACHER_ROLE,
      permissions: [],
      error: null,
      ...authState,
    },
  };
  const store = makeTestStore(preloadedState);

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <AppThemeProvider>{children}</AppThemeProvider>
      </Provider>
    );
  }

  // RTL v14's render() is async (backed by the concurrent test renderer) — must be awaited
  // before its query helpers (findByText etc.) exist on the result.
  const result = await render(ui, { wrapper: Wrapper, ...renderOptions });
  return { store, ...result };
}

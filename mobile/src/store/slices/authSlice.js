import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import { secureStorage } from '../../utils/secureStorage';
import { clearAuthTokens, hydrateAuthTokens, setAuthTokens } from '../../api/client';

const initialState = {
  status: 'idle', // idle | loading | authenticated | unauthenticated | error
  user: null,
  role: null,
  permissions: [],
  error: null,
};

export const bootstrapSession = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  const { accessToken } = await hydrateAuthTokens();
  if (!accessToken) return rejectWithValue('no-session');

  try {
    const response = await authApi.getProfile();
    return response.data.data;
  } catch (error) {
    await secureStorage.clearTokens();
    clearAuthTokens();
    return rejectWithValue(error?.response?.data?.message || 'Session expired');
  }
});

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await authApi.login(email, password);
    const { user, accessToken, refreshToken } = response.data.data;
    setAuthTokens({ accessToken, refreshToken });
    await secureStorage.setTokens({ accessToken, refreshToken });
    return user;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || 'Unable to sign in. Check your email and password.');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch (error) {
    // Best-effort — proceed with local sign-out even if the server call fails.
  }
  await secureStorage.clearTokens();
  clearAuthTokens();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.status = 'unauthenticated';
      state.user = null;
      state.role = null;
      state.permissions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.role = action.payload.role ?? null;
        state.permissions = action.payload.role?.permissions ?? [];
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.role = null;
        state.permissions = [];
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.role = action.payload.role ?? null;
        state.permissions = action.payload.role?.permissions ?? [];
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.role = null;
        state.permissions = [];
        state.error = null;
      });
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;

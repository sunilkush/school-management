import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import { secureStorage } from '../../utils/secureStorage';
import { clearAuthTokens, hydrateAuthTokens, setAuthTokens } from '../../api/client';
import { API_BASE_URL } from '../../constants/config';

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

/**
 * Says what actually went wrong instead of always blaming the password.
 *
 * When the phone cannot reach the server at all, axios rejects with no `response` — and the old
 * message ("Check your email and password") sent people off retyping a password that was fine.
 * The usual cause is the API URL: `EXPO_PUBLIC_API_URL` unset means it falls back to `localhost`,
 * which on a phone is the phone itself, not the machine running the backend.
 */
export function describeLoginFailure(error) {
  if (error?.response) {
    // The server answered, so it gets to say why.
    return error.response.data?.message || 'Unable to sign in. Check your email and password.';
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to answer. Check that you are on the same network as it.';
  }
  return `Could not reach the server at ${API_BASE_URL}. Check that the backend is running and that this device is on the same network.`;
}

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await authApi.login(email, password);
    const { user, accessToken, refreshToken } = response.data.data;
    setAuthTokens({ accessToken, refreshToken });
    await secureStorage.setTokens({ accessToken, refreshToken });
    return user;
  } catch (error) {
    return rejectWithValue(describeLoginFailure(error));
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const response = await authApi.updateProfile(payload);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to update profile');
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
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload.role ?? state.role;
        state.permissions = action.payload.role?.permissions ?? state.permissions;
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

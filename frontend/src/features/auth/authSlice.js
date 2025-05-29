import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// LocalStorage init
const storedUser = localStorage.getItem('user');
const user = storedUser ? JSON.parse(storedUser) : null;
const accessToken = localStorage.getItem('accessToken');

// API endpoint
const API = `http://localhost:9000/app/v1/user`;

// Register Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API}/register`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'User registration failed!'
      );
    }
  }
);

// Login Thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/login`, credentials);
      const { user, accessToken } = res.data.data;
      return { user, accessToken };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login Failed'
      );
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user || null,
    accessToken: accessToken || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        localStorage.clear();
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        localStorage.clear();
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

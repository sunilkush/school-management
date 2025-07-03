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

// Get All Users
export const fetchAllUser = createAsyncThunk(
  'auth/fetchAllUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API}/get_all_user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch users'
      );
    }
  }
);
// Update User Profile
export const updateProfile = createAsyncThunk("auth/updateProfile",async(userId,{rejectWithValue})=>{
  try {
     const token = localStorage.getItem('accessToken');
     const res = await axios.patch(`${API}/update/${userId}`, {
      headers:{
        Authorization: `Bearer ${token}`,
      }
     },)
     return res.data.data;
  } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile' )
  }
})

// Delete (Deactivate) User
export const deleteUser = createAsyncThunk(
  'auth/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.patch(`${API}/delete/${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete user'
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
    users: [],
    success: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.clear();
    },
    resetAuthState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔐 Login
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

      // 📝 Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || 'Something went wrong';
      })

      // 📥 Fetch Users
      .addCase(fetchAllUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || [];
      })
      .addCase(fetchAllUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ❌ Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally remove from local state:
        state.users = state.users.map(user =>
          user._id === action.payload._id ? { ...user, isActive: false } : user
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
      // Update Profile
      builder.addCase(updateProfile.pending, (state)=>{
        state.loading = true;
        state.error = null;
      }).addCase(updateProfile.fulfilled,(state,action)=>{
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));   
      }).addCase(updateProfile.rejected,(state,action)=>{
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      })
  },
});

export const { logout, resetAuthState } = authSlice.actions;
export default authSlice.reducer;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// LocalStorage init
const storedUser = localStorage.getItem('user');
const user = storedUser ? JSON.parse(storedUser) : null;
const accessToken = localStorage.getItem('accessToken');

// API endpoint
const Api_Base_Url = import.meta.env.VITE_API_URL;

// Register Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${Api_Base_Url}/user/register`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'User registration failed!');
    }
  }
);

// Login Thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${Api_Base_Url}/user/login`, credentials);
      const { user, accessToken } = res.data.data;
      return { user, accessToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login Failed');
    }
  }
);

// Fetch All Users
export const fetchAllUser = createAsyncThunk(
  "users/fetchUsers",
  async (schoolId, { rejectWithValue }) => {
    try {
      debugger;
       const token = localStorage.getItem('accessToken');
      // agar schoolId diya ho to query me bhejo
      const url = schoolId
        ? `${Api_Base_Url}/user/all?schoolId=${schoolId}`
        : `${Api_Base_Url}/user/all`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data; // ✅ ApiResponse ke andar data hota hai
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.patch(`${Api_Base_Url}/user/update/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);



// Delete User
export const deleteUser = createAsyncThunk(
  'auth/deleteUser',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.patch(`${Api_Base_Url}/user/delete/${id}`, { isActive }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);
// Active User
export const activeUser = createAsyncThunk(
  'auth/ActiveUser',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.patch(`${Api_Base_Url}/user/Active/${id}`, { isActive }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);
// Get Current User Profile
export const currentUser = createAsyncThunk(
  'auth/currentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${Api_Base_Url}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      console.log('currentUser error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message);
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
    profile: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.profile = null;
      localStorage.clear();

    },
    resetAuthState: (state) => {
      state.success = false;
      state.error = null;

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
        state.success = false;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // Fetch All Users
      .addCase(fetchAllUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.map(user =>
          user._id === action.payload._id ? { ...user, isActive: false } : user
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Current User
      .addCase(currentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(currentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(currentUser.rejected, (state, action) => {
        state.loading = false;
        state.profile = null;
        state.user = null;
        state.accessToken = null;
        localStorage.clear();
        state.error = action.payload;
      })

       // Activ User
      .addCase(activeUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(activeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.map(user =>
          user._id === action.payload._id ? { ...user, isActive: true } : user
        );
      })
      .addCase(activeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { logout, resetAuthState } = authSlice.actions;
export default authSlice.reducer;

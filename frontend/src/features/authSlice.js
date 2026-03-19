import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
// ================= CONFIG ================= //
const API_URL = import.meta.env.VITE_API_URL;

const storedUser = localStorage.getItem('user')
const storedToken = localStorage.getItem('accessToken')

// ================= HELPER ================= //
const clearAuthStorage = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
};
// ================= AUTH ================= // LOGIN 

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      // ❌ REMOVE TOKEN FROM LOGIN
      const res = await axios.post(`${API_URL}/user/login`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);
// REFRESH TOKEN 

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/user/refresh-token`, {}, {
        withCredentials: true
      });
      return res.data.data;
    }
    catch (err) {
      return rejectWithValue("Session expired", err);
    }
  });
// FORGOT PASSWORD 

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/user/forgot-password`, { email });
      return res.data.message;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// RESET PASSWORD 
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/user/reset-password/${token}`, { password });
      return res.data.message;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// VERIFY EMAIL 

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (token, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_URL}/user/verify-email/${token}`);
    return res.data.message;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});
// RESEND VERIFICATION 
export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/user/resend-verification`, { email });
      return res.data.message;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// LOGOUT 

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async () => {
    clearAuthStorage();
    return true;
  });
// ================= USER ================= // REGISTER (ADMIN) 
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.post(`${API_URL}/user/register`, data, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      return res.data;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// GET PROFILE 

export const currentUser = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
     const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }


      const res = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    }
  }
);
// UPDATE USER

export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.put(`${API_URL}/user/update`, data, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// CHANGE PASSWORD 
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.put(`${API_URL}/user/change-password`, data, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      return res.data.message;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// PERMISSIONS
export const getMyPermissions = createAsyncThunk("auth/permissions", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return rejectWithValue("No token found");
    }
    const res = await axios.get(`${API_URL}/user/my-permissions`, {
      headers: { Authorization: `Bearer ${token}`, }
    });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});
// ALL USERS 
export const fetchAllUser = createAsyncThunk(
  "auth/allUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.get(`${API_URL}/user/all`, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      
      return res.data;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// DELETE USER 
export const deleteUser = createAsyncThunk(
  "auth/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.patch(`${API_URL}/user/delete/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      return res.data.data;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// ACTIVATE USER 
export const activeUser = createAsyncThunk(
  "auth/activeUser",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.patch(`${API_URL}/user/active/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// GET USER BY ID 
export const getUserById = createAsyncThunk(
  "auth/getUserById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No token found");
      }
      const res = await axios.get(`${API_URL}/user/single/${id}`, {
        headers: { Authorization: `Bearer ${token}`, }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// // ================= SLICE ================= 
// ================= INITIAL STATE ================= // 
const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedToken || null, users: [],
  profile: null,
  permissions: [],
  loading: false,
  error: null,
  success: false,
  hasFetchedUsers: false,
};
const authSlice = createSlice({
  name: "auth", initialState, reducers: {
    logoutLocal: (state) => {
      state.user = null;
      state.accessToken = null;
      state.profile = null;
      clearAuthStorage();
    },
    resetState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // // LOGIN 
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("accessToken", action.payload.accessToken);
      })
      // // PROFILE 
      .addCase(currentUser.fulfilled, (state, action) => {
        state.user = action.payload; 
        state.profile = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.profile = null;
        state.permissions = [];
        state.success = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.profile = null;
        state.permissions = [];
        state.success = false;
      })
      // USERS 
      .addCase(fetchAllUser.fulfilled, (state, action) => {
        state.users = action.payload.data.data;
        state.hasFetchedUsers = true;
      })
      // DELETE 
      .addCase(deleteUser.fulfilled, (state, action) => {
        const id = action.meta.arg.id;
        state.users = state.users.map((u) =>
          u._id === id ? { ...u, isActive: false } : u
        );
      })

      // ACTIVE 
      .addCase(activeUser.fulfilled, (state, action) => {
        state.users = state.users.map((u) => u._id === action.payload._id ? action.payload : u);
      })

      //  GLOBAL STATES 
      .addMatcher((action) => action.type.endsWith("/pending"), (state) => {
        state.loading = true;
      })
      .addMatcher((action) => action.type.endsWith("/fulfilled"), (state) => {
        state.loading = false; state.error = null;
      })
      .addMatcher((action) => action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const { logoutLocal, resetState } = authSlice.actions;
export default authSlice.reducer;
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";
import { clearAccessToken, setAccessToken } from "../api/authToken";

export const loginUser = createAsyncThunk("auth/login", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/login", data);
    const payload = res.data?.data || {};
    setAccessToken(payload.accessToken);
    return payload;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const initializeAuth = createAsyncThunk("auth/initialize", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/refresh-token", {});
    const payload = res.data?.data || {};
    if (!payload?.accessToken) throw new Error("Session not found");
    setAccessToken(payload.accessToken);
    return payload;
  } catch (err) {
    clearAccessToken();
    return rejectWithValue(err.response?.data?.message || "Session expired");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await apiClient.post("/user/logout", {});
    clearAccessToken();
    return true;
  } catch (err) {
    clearAccessToken();
    return rejectWithValue(err.response?.data?.message || "Logout failed");
  }
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (email, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/forgot-password", { email });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async ({ token, password }, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(`/user/reset-password/${token}`, { password });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (token, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`/user/verify-email/${token}`);
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const resendVerification = createAsyncThunk("auth/resendVerification", async (email, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/resend-verification", { email });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const registerUser = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/register", data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const currentUser = createAsyncThunk("auth/profile", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/user/profile");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || "Something went wrong");
  }
});

export const updateUser = createAsyncThunk("auth/updateUser", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.put("/user/update", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const changePassword = createAsyncThunk("auth/changePassword", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.put("/user/change-password", data);
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const getMyPermissions = createAsyncThunk("auth/permissions", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/user/my-permissions");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchAllUser = createAsyncThunk("auth/allUsers", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/user/all");
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteUser = createAsyncThunk("auth/deleteUser", async (id, { rejectWithValue }) => {
  try {
    const res = await apiClient.patch(`/user/delete/${id}`, {});
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const activeUser = createAsyncThunk("auth/activeUser", async (id, { rejectWithValue }) => {
  try {
    const res = await apiClient.patch(`/user/active/${id}`, {});
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const getUserById = createAsyncThunk("auth/getUserById", async (id, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`/user/single/${id}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const initialState = {
  user: null,
  accessToken: null,
  users: [],
  profile: null,
  permissions: [],
  loading: false,
  error: null,
  success: false,
  hasFetchedUsers: false,
  isAuthInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startAuthInitialization: (state) => {
      state.isAuthInitialized = false;
    },
    completeAuthInitialization: (state) => {
      state.isAuthInitialized = true;
    },
    setCredentials: (state, action) => {
      state.user = action.payload?.user ?? null;
      state.accessToken = action.payload?.accessToken ?? null;
      state.profile = action.payload?.user ?? state.profile;
      state.isAuthInitialized = true;
    },
    forceLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.profile = null;
      state.permissions = [];
      state.success = false;
      state.hasFetchedUsers = false;
      state.isAuthInitialized = true;
    },
    resetState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.profile = action.payload.user;
        state.isAuthInitialized = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload?.user ?? state.user;
        state.accessToken = action.payload.accessToken;
        state.profile = action.payload?.user ?? state.profile;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.profile = null;
      })
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
        state.isAuthInitialized = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.profile = null;
        state.permissions = [];
        state.success = false;
        state.isAuthInitialized = true;
      })
      .addCase(fetchAllUser.fulfilled, (state, action) => {
        state.users = action.payload.data.data;
        state.hasFetchedUsers = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const id = action.meta.arg.id;
        state.users = state.users.map((u) => (u._id === id ? { ...u, isActive: false } : u));
      })
      .addCase(activeUser.fulfilled, (state, action) => {
        state.users = state.users.map((u) => (u._id === action.payload._id ? action.payload : u));
      })
      .addMatcher((action) => action.type.endsWith("/pending"), (state) => {
        state.loading = true;
      })
      .addMatcher((action) => action.type.endsWith("/fulfilled"), (state) => {
        state.loading = false;
        state.error = null;
      })
      .addMatcher((action) => action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  forceLogout,
  resetState,
  setCredentials,
  startAuthInitialization,
  completeAuthInitialization,
} = authSlice.actions;
export default authSlice.reducer;

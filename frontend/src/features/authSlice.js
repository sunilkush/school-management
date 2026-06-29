import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/authToken";

export const loginUser = createAsyncThunk("user/login", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/login", data);
    const payload = res.data?.data || {};
    setAccessToken(payload.accessToken);
    return payload;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const initializeAuth = createAsyncThunk(
  "user/initialize",
  async (_, { getState, rejectWithValue }) => {
    const existingToken = getState().auth?.accessToken || getAccessToken();

    if (existingToken) {
      setAccessToken(existingToken);
      return { accessToken: existingToken, user: getState().auth?.user ?? null, skipped: true };
    }

    try {
      const res = await apiClient.post("/user/refresh-token", {});
      const payload = res.data?.data || {};
      if (!payload?.accessToken) throw new Error("Session not found");
      setAccessToken(payload.accessToken);
      return payload;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Session expired");
    }
  }
);

export const logoutUser = createAsyncThunk("user/logout", async (_, { rejectWithValue }) => {
  try {
    await apiClient.post("/user/logout", {});
    clearAccessToken();
    return true;
  } catch (err) {
    clearAccessToken();
    return rejectWithValue(err.response?.data?.message || "Logout failed");
  }
});

export const forgotPassword = createAsyncThunk("user/forgotPassword", async (email, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/forgot-password", { email });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const resetPassword = createAsyncThunk("user/resetPassword", async ({ token, password }, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(`/user/reset-password/${token}`, { password });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const verifyEmail = createAsyncThunk("user/verifyEmail", async (token, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`/user/verify-email/${token}`);
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const resendVerification = createAsyncThunk("user/resendVerification", async (email, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/user/resend-verification", { email });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const registerUser = createAsyncThunk("user/register", async (data, { rejectWithValue }) => {
  try {
    const formData = new FormData();

    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (key === "avatar") {
        const avatarFile = Array.isArray(value) ? value[0]?.originFileObj : null;
        if (avatarFile) {
          formData.append("avatar", avatarFile);
        }
        return;
      }

      formData.append(key, value);
    });

    const res = await apiClient.post("/user/register", formData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const currentUser = createAsyncThunk(
  "user/profile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/user/me");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Something went wrong");
    }
  },
  {
    condition: (_, { getState }) => {
      const token = getState().auth?.accessToken || getAccessToken();
      return Boolean(token);
    },
  }
);

export const updateUser = createAsyncThunk("user/updateUser", async (data, { rejectWithValue }) => {
  try {
    let payload = data;
    if (data?.avatarFile) {
      const fd = new FormData();
      if (data.name)  fd.append("name",  data.name);
      if (data.email) fd.append("email", data.email);
      if (data.phone !== undefined) fd.append("phone", data.phone);
      fd.append("avatar", data.avatarFile);
      payload = fd;
    }
    const res = await apiClient.put("/user/update", payload);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const changePassword = createAsyncThunk("user/changePassword", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.put("/user/change-password", data);
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const getMyPermissions = createAsyncThunk("user/permissions", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/user/my-permissions");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchAllUser = createAsyncThunk("user/allUsers", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/user/all", { params });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteUser = createAsyncThunk("user/deleteUser", async (id, { rejectWithValue }) => {
  try {
    await apiClient.patch(`/user/delete/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const activeUser = createAsyncThunk("user/activeUser", async (id, { rejectWithValue }) => {
  try {
    const res = await apiClient.patch(`/user/active/${id}`, {});
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const getUserById = createAsyncThunk("user/getUserById", async (id, { rejectWithValue }) => {
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
  isLoggingOut: false,
  subscriptionWarning: null,
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
        state.subscriptionWarning = action.payload.subscriptionWarning || null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload?.user ?? state.user;
        state.accessToken = action.payload?.accessToken ?? state.accessToken;
        state.profile = action.payload?.user ?? state.profile;
      })
      .addCase(initializeAuth.rejected, (state) => {
        if (!state.accessToken) {
          state.user = null;
          state.accessToken = null;
          state.profile = null;
        }
      })
      .addCase(currentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.profile = action.payload;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        if (action.payload) {
          const { name, email, phone, avatar, role, school, isActive } = action.payload;
          const patch = {};
          if (name   !== undefined) patch.name   = name;
          if (email  !== undefined) patch.email  = email;
          if (phone  !== undefined) patch.phone  = phone;
          if (avatar !== undefined) patch.avatar = avatar;
          if (role)                 patch.role   = role;
          if (school)               patch.school = school;
          if (isActive !== undefined) patch.isActive = isActive;
          state.user    = { ...state.user,    ...patch };
          state.profile = { ...state.profile, ...patch };
        }
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoggingOut = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.profile = null;
        state.permissions = [];
        state.success = false;
        state.isAuthInitialized = true;
        state.isLoggingOut = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.profile = null;
        state.permissions = [];
        state.success = false;
        state.isAuthInitialized = true;
        state.isLoggingOut = false;
      })
      .addCase(fetchAllUser.fulfilled, (state, action) => {
        state.users = action.payload;
        state.hasFetchedUsers = true;
        state.loading = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.success = true;
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      })
      .addCase(activeUser.fulfilled, (state, action) => {
        state.users = state.users.map((u) => (u._id === action.payload._id ? action.payload : u));
      })
     .addMatcher((action) => action.type.startsWith("user/") && action.type.endsWith("/pending"), (state) => {
        state.loading = true;
      })
      .addMatcher((action) => action.type.startsWith("user/") && action.type.endsWith("/fulfilled"), (state) => {
        state.loading = false;
        state.error = null;
      })
      .addMatcher((action) => action.type.startsWith("user/") && action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { startAuthInitialization, completeAuthInitialization, setCredentials, forceLogout, resetState } =
  authSlice.actions;
export default authSlice.reducer;

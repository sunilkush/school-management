import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";
// ================= CONFIG ================= //
const API_URL = import.meta.env.VITE_API_URL;


// ================= HELPER ================= //

// ================= AUTH ================= // LOGIN 

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      // ❌ REMOVE TOKEN FROM LOGIN
      const res = await httpClient.post(`/user/login`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);
// refresh token
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const res = await httpClient.post(
        `/user/refresh-token`
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue("Session expired",err);
    }
  }
);

// FORGOT PASSWORD 

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await httpClient.post(`/user/forgot-password`, { email });
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
      const res = await httpClient.post(`/user/reset-password/${token}`, { password });
      return res.data.message;
    }
    catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
// VERIFY EMAIL 

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (token, { rejectWithValue }) => {
  try {
    const res = await httpClient.get(`/user/verify-email/${token}`);
    return res.data.message;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});
// RESEND VERIFICATION 
export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (email, { rejectWithValue }) => {
    try {
      const res = await httpClient.post(`/user/resend-verification`, { email });
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
   
    return true;
  });
// ================= USER ================= // REGISTER (ADMIN) 
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      
      const res = await httpClient.post(`/user/register`, data, {
        
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
     


      const res = await httpClient.get(`/user/profile`, {
       
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
     
      const res = await httpClient.put(`/user/update`, data, {
        
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
      
      const res = await httpClient.put(`/user/change-password`, data, {
        
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
   
    const res = await httpClient.get(`/user/my-permissions`, {
      
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
      
      const res = await httpClient.get(`/user/all`, {
        
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
     
      
        
     
      const res = await httpClient.patch(`/user/delete/${id}`, {}, {
        
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
     
      
        
     
      const res = await httpClient.patch(`/user/active/${id}`, {}, {
        
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
      
      
        
    
      const res = await httpClient.get(`/user/single/${id}`, {
        
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });
  export const forceLogout = createAsyncThunk(
  "auth/forceLogout",
  async (_, { rejectWithValue }) => {
    try {
      // 🔥 backend se cookies clear
      await httpClient.post(
        `/user/logout`,
        {},
        
      );

      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
      
    }
  }
);
// // ================= SLICE ================= 
// ================= INITIAL STATE ================= // 
const initialState = {
  user: null,
  accessToken:  null, 
  users: [],
  profile: null,
  permissions: [],
  loading: false,
  error: null,
  success: false,
  hasFetchedUsers: false,
  isAuthInitialized: false
};
const authSlice = createSlice({
  name: "auth", initialState, 
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      if (user) state.user = user;
      if (accessToken) state.accessToken = accessToken;
    },
    logoutLocal: (state) => {
      state.user = null;
      state.accessToken = null;
      state.profile = null;
      
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
     
      })
      /* REFRESH */
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthInitialized = true;
      })

      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthInitialized = true;
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
            .addCase(forceLogout.fulfilled, (state) => {
          state.user = null;
          state.accessToken = null;
          state.profile = null;
          state.permissions = [];
          state.isAuthInitialized = true;
        })

        .addCase(forceLogout.rejected, (state) => {
          // 🔥 fallback safety
          state.user = null;
          state.accessToken = null;
          state.profile = null;
          state.permissions = [];
          state.isAuthInitialized = true;
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
export const { logoutLocal, resetState, setCredentials } = authSlice.actions;
export default authSlice.reducer;
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const forgotPasswordRequest = createAsyncThunk(
  "accountRecovery/forgotPasswordRequest",
  async (email, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/user/forgot-password", { email });
      return res.data?.message || "Reset link sent successfully";
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send reset link");
    }
  }
);

export const resetPasswordRequest = createAsyncThunk(
  "accountRecovery/resetPasswordRequest",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/user/reset-password/${token}`, { password });
      return res.data?.message || "Password reset successfully";
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reset password");
    }
  }
);

export const verifyEmailRequest = createAsyncThunk(
  "accountRecovery/verifyEmailRequest",
  async (token, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/user/verify-email/${token}`);
      return res.data?.message || "Email verified successfully";
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Email verification failed");
    }
  }
);

export const resendVerificationRequest = createAsyncThunk(
  "accountRecovery/resendVerificationRequest",
  async (email, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/user/resend-verification", { email });
      return res.data?.message || "Verification email sent successfully";
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to resend verification email");
    }
  }
);

const initialState = {
  forgotPassword: { loading: false, success: false, message: null, error: null },
  resetPassword: { loading: false, success: false, message: null, error: null },
  verifyEmail: { loading: false, success: false, message: null, error: null },
  resendVerification: { loading: false, success: false, message: null, error: null },
};

const start = (state, key) => {
  state[key].loading = true;
  state[key].success = false;
  state[key].error = null;
  state[key].message = null;
};

const success = (state, key, action) => {
  state[key].loading = false;
  state[key].success = true;
  state[key].message = action.payload;
};

const failure = (state, key, action) => {
  state[key].loading = false;
  state[key].success = false;
  state[key].error = action.payload;
};

const accountRecoverySlice = createSlice({
  name: "accountRecovery",
  initialState,
  reducers: {
    resetAccountRecoveryState: () => initialState,
    clearRecoveryState: (state, action) => {
      const key = action.payload;
      if (!key || !state[key]) return;
      state[key] = { loading: false, success: false, message: null, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(forgotPasswordRequest.pending, (state) => start(state, "forgotPassword"))
      .addCase(forgotPasswordRequest.fulfilled, (state, action) => success(state, "forgotPassword", action))
      .addCase(forgotPasswordRequest.rejected, (state, action) => failure(state, "forgotPassword", action))
      .addCase(resetPasswordRequest.pending, (state) => start(state, "resetPassword"))
      .addCase(resetPasswordRequest.fulfilled, (state, action) => success(state, "resetPassword", action))
      .addCase(resetPasswordRequest.rejected, (state, action) => failure(state, "resetPassword", action))
      .addCase(verifyEmailRequest.pending, (state) => start(state, "verifyEmail"))
      .addCase(verifyEmailRequest.fulfilled, (state, action) => success(state, "verifyEmail", action))
      .addCase(verifyEmailRequest.rejected, (state, action) => failure(state, "verifyEmail", action))
      .addCase(resendVerificationRequest.pending, (state) => start(state, "resendVerification"))
      .addCase(resendVerificationRequest.fulfilled, (state, action) => success(state, "resendVerification", action))
      .addCase(resendVerificationRequest.rejected, (state, action) => failure(state, "resendVerification", action));
  },
});

export const { resetAccountRecoveryState, clearRecoveryState } = accountRecoverySlice.actions;

export default accountRecoverySlice.reducer;

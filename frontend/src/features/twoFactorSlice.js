import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetch2FAStatus = createAsyncThunk("twoFactor/status", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/2fa/status");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch 2FA status");
  }
});

export const enable2FA = createAsyncThunk("twoFactor/enable", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/2fa/enable");
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to initiate 2FA");
  }
});

export const confirm2FA = createAsyncThunk("twoFactor/confirm", async (otp, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/2fa/confirm-enable", { otp });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "OTP verification failed");
  }
});

export const requestDisableOTP = createAsyncThunk("twoFactor/requestDisableOTP", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/2fa/request-disable-otp");
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to send OTP");
  }
});

export const disable2FA = createAsyncThunk("twoFactor/disable", async (otp, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/2fa/disable", { otp });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to disable 2FA");
  }
});

const twoFactorSlice = createSlice({
  name: "twoFactor",
  initialState: {
    enabled: false,
    method: "none",
    email: "",
    otpSent: false,
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    resetTwoFactorState: (state) => {
      state.error = null;
      state.success = null;
      state.otpSent = false;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; state.success = null; };
    const failed = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetch2FAStatus.pending, pending)
      .addCase(fetch2FAStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.enabled = action.payload?.twoFactorEnabled || false;
        state.method = action.payload?.twoFactorMethod || "none";
        state.email = action.payload?.email || "";
      })
      .addCase(fetch2FAStatus.rejected, failed)

      .addCase(enable2FA.pending, pending)
      .addCase(enable2FA.fulfilled, (state) => { state.loading = false; state.otpSent = true; state.success = "OTP sent to your email"; })
      .addCase(enable2FA.rejected, failed)

      .addCase(confirm2FA.pending, pending)
      .addCase(confirm2FA.fulfilled, (state) => { state.loading = false; state.enabled = true; state.otpSent = false; state.success = "2FA enabled successfully"; })
      .addCase(confirm2FA.rejected, failed)

      .addCase(requestDisableOTP.pending, pending)
      .addCase(requestDisableOTP.fulfilled, (state) => { state.loading = false; state.otpSent = true; state.success = "OTP sent to your email"; })
      .addCase(requestDisableOTP.rejected, failed)

      .addCase(disable2FA.pending, pending)
      .addCase(disable2FA.fulfilled, (state) => { state.loading = false; state.enabled = false; state.otpSent = false; state.success = "2FA disabled successfully"; })
      .addCase(disable2FA.rejected, failed);
  },
});

export const { resetTwoFactorState } = twoFactorSlice.actions;
export default twoFactorSlice.reducer;

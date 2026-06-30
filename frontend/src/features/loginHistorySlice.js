import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchMyLoginHistory = createAsyncThunk(
  "loginHistory/fetchMine",
  async ({ userId, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/login-logs/user/${userId}`, { params: { page, limit } });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch login history");
    }
  }
);

export const fetchAllLoginLogs = createAsyncThunk(
  "loginHistory/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/login-logs", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch login logs");
    }
  }
);

export const fetchLoginStats = createAsyncThunk(
  "loginHistory/stats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/login-logs/stats", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

const loginHistorySlice = createSlice({
  name: "loginHistory",
  initialState: {
    logs: [],
    pagination: null,
    stats: null,
    dailyTrend: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearLoginHistory: (state) => { state.logs = []; state.pagination = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const failed = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchMyLoginHistory.pending, pending)
      .addCase(fetchMyLoginHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload?.logs || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchMyLoginHistory.rejected, failed)

      .addCase(fetchAllLoginLogs.pending, pending)
      .addCase(fetchAllLoginLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload?.logs || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchAllLoginLogs.rejected, failed)

      .addCase(fetchLoginStats.pending, pending)
      .addCase(fetchLoginStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload?.stats || [];
        state.dailyTrend = action.payload?.dailyTrend || [];
      })
      .addCase(fetchLoginStats.rejected, failed);
  },
});

export const { clearLoginHistory } = loginHistorySlice.actions;
export default loginHistorySlice.reducer;

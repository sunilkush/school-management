import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchAttendanceSummary = createAsyncThunk(
  "analytics/attendance",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/analytics/attendance", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch attendance summary");
    }
  }
);

export const fetchFinanceSummary = createAsyncThunk(
  "analytics/finance",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/analytics/finance", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch finance summary");
    }
  }
);

export const fetchAcademicSummary = createAsyncThunk(
  "analytics/academic",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/analytics/academic", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch academic summary");
    }
  }
);

export const fetchPlatformOverview = createAsyncThunk(
  "analytics/overview",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/analytics/overview");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch overview");
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    attendance: null,
    finance: null,
    academic: null,
    overview: null,
    loading: { attendance: false, finance: false, academic: false, overview: false },
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceSummary.pending, (state) => { state.loading.attendance = true; })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => { state.loading.attendance = false; state.attendance = action.payload; })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => { state.loading.attendance = false; state.error = action.payload; })

      .addCase(fetchFinanceSummary.pending, (state) => { state.loading.finance = true; })
      .addCase(fetchFinanceSummary.fulfilled, (state, action) => { state.loading.finance = false; state.finance = action.payload; })
      .addCase(fetchFinanceSummary.rejected, (state, action) => { state.loading.finance = false; state.error = action.payload; })

      .addCase(fetchAcademicSummary.pending, (state) => { state.loading.academic = true; })
      .addCase(fetchAcademicSummary.fulfilled, (state, action) => { state.loading.academic = false; state.academic = action.payload; })
      .addCase(fetchAcademicSummary.rejected, (state, action) => { state.loading.academic = false; state.error = action.payload; })

      .addCase(fetchPlatformOverview.pending, (state) => { state.loading.overview = true; })
      .addCase(fetchPlatformOverview.fulfilled, (state, action) => { state.loading.overview = false; state.overview = action.payload; })
      .addCase(fetchPlatformOverview.rejected, (state, action) => { state.loading.overview = false; state.error = action.payload; });
  },
});

export default analyticsSlice.reducer;

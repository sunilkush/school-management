import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const BASE = "/counseling-sessions";

export const fetchCounselingSessions = createAsyncThunk("counseling/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(BASE, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch sessions");
  }
});

export const fetchCounselingStats = createAsyncThunk("counseling/stats", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`${BASE}/stats`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
  }
});

export const createCounselingSession = createAsyncThunk("counseling/create", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(BASE, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create session");
  }
});

export const updateCounselingSession = createAsyncThunk("counseling/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update session");
  }
});

export const deleteCounselingSession = createAsyncThunk("counseling/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`${BASE}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete session");
  }
});

const initialState = { sessions: [], total: 0, stats: {}, loading: false, saving: false, error: null };

const counselingSessionSlice = createSlice({
  name: "counseling",
  initialState,
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCounselingSessions.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCounselingSessions.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCounselingSessions.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload;
        s.sessions = Array.isArray(d?.sessions) ? d.sessions : Array.isArray(d) ? d : [];
        s.total    = d?.total ?? s.sessions.length;
      })
      .addCase(fetchCounselingStats.fulfilled, (s, a) => { s.stats = a.payload ?? {}; })
      .addCase(createCounselingSession.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(createCounselingSession.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(createCounselingSession.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload?._id) s.sessions.unshift(a.payload);
      })
      .addCase(updateCounselingSession.fulfilled, (s, a) => {
        const u = a.payload;
        if (u?._id) s.sessions = s.sessions.map((x) => x._id === u._id ? u : x);
      })
      .addCase(deleteCounselingSession.fulfilled, (s, a) => {
        s.sessions = s.sessions.filter((x) => x._id !== a.payload);
      });
  },
});

export const { clearError: clearCounselingError } = counselingSessionSlice.actions;
export default counselingSessionSlice.reducer;

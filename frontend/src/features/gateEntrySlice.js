import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const BASE = "/gate-entries";

export const fetchGateEntries = createAsyncThunk("gateEntry/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(BASE, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch entries");
  }
});

export const fetchGateStats = createAsyncThunk("gateEntry/stats", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`${BASE}/stats`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
  }
});

export const createGateEntry = createAsyncThunk("gateEntry/create", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(BASE, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create entry");
  }
});

export const markGateExit = createAsyncThunk("gateEntry/markExit", async (id, { rejectWithValue }) => {
  try {
    const res = await apiClient.patch(`${BASE}/${id}/exit`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to mark exit");
  }
});

export const deleteGateEntry = createAsyncThunk("gateEntry/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`${BASE}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete entry");
  }
});

const initialState = { entries: [], total: 0, stats: {}, loading: false, saving: false, error: null };

const gateEntrySlice = createSlice({
  name: "gateEntry",
  initialState,
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGateEntries.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchGateEntries.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchGateEntries.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload;
        s.entries = Array.isArray(d?.entries) ? d.entries : Array.isArray(d) ? d : [];
        s.total   = d?.total ?? s.entries.length;
      })
      .addCase(fetchGateStats.fulfilled, (s, a) => { s.stats = a.payload ?? {}; })
      .addCase(createGateEntry.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(createGateEntry.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(createGateEntry.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload?._id) s.entries.unshift(a.payload);
      })
      .addCase(markGateExit.fulfilled, (s, a) => {
        const updated = a.payload;
        if (updated?._id) s.entries = s.entries.map((e) => e._id === updated._id ? updated : e);
      })
      .addCase(deleteGateEntry.fulfilled, (s, a) => {
        s.entries = s.entries.filter((e) => e._id !== a.payload);
      });
  },
});

export const { clearError: clearGateEntryError } = gateEntrySlice.actions;
export default gateEntrySlice.reducer;

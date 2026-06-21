import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const BASE = "/call-logs";

export const fetchCallLogs = createAsyncThunk("callLog/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(BASE, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch call logs");
  }
});

export const createCallLog = createAsyncThunk("callLog/create", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(BASE, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create call log");
  }
});

export const updateCallLog = createAsyncThunk("callLog/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update call log");
  }
});

export const deleteCallLog = createAsyncThunk("callLog/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`${BASE}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete call log");
  }
});

const initialState = { logs: [], total: 0, loading: false, saving: false, error: null };

const callLogSlice = createSlice({
  name: "callLog",
  initialState,
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCallLogs.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCallLogs.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCallLogs.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload;
        s.logs  = Array.isArray(d?.logs) ? d.logs : Array.isArray(d) ? d : [];
        s.total = d?.total ?? s.logs.length;
      })
      .addCase(createCallLog.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(createCallLog.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(createCallLog.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload?._id) s.logs.unshift(a.payload);
      })
      .addCase(updateCallLog.fulfilled, (s, a) => {
        const u = a.payload;
        if (u?._id) s.logs = s.logs.map((l) => l._id === u._id ? u : l);
      })
      .addCase(deleteCallLog.fulfilled, (s, a) => {
        s.logs = s.logs.filter((l) => l._id !== a.payload);
      });
  },
});

export const { clearError: clearCallLogError } = callLogSlice.actions;
export default callLogSlice.reducer;

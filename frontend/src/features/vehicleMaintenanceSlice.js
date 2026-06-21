import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const BASE = "/vehicle-maintenance";

export const fetchMaintenanceRecords = createAsyncThunk("vehicleMaint/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(BASE, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch maintenance records");
  }
});

export const fetchMaintenanceStats = createAsyncThunk("vehicleMaint/stats", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`${BASE}/stats`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
  }
});

export const createMaintenanceRecord = createAsyncThunk("vehicleMaint/create", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(BASE, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create record");
  }
});

export const updateMaintenanceRecord = createAsyncThunk("vehicleMaint/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiClient.put(`${BASE}/${id}`, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update record");
  }
});

export const deleteMaintenanceRecord = createAsyncThunk("vehicleMaint/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`${BASE}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete record");
  }
});

const initialState = { records: [], total: 0, stats: {}, loading: false, saving: false, error: null };

const vehicleMaintenanceSlice = createSlice({
  name: "vehicleMaint",
  initialState,
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceRecords.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMaintenanceRecords.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchMaintenanceRecords.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload;
        s.records = Array.isArray(d?.records) ? d.records : Array.isArray(d) ? d : [];
        s.total   = d?.total ?? s.records.length;
      })
      .addCase(fetchMaintenanceStats.fulfilled, (s, a) => { s.stats = a.payload ?? {}; })
      .addCase(createMaintenanceRecord.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(createMaintenanceRecord.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(createMaintenanceRecord.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload?._id) s.records.unshift(a.payload);
      })
      .addCase(updateMaintenanceRecord.fulfilled, (s, a) => {
        const u = a.payload;
        if (u?._id) s.records = s.records.map((r) => r._id === u._id ? u : r);
      })
      .addCase(deleteMaintenanceRecord.fulfilled, (s, a) => {
        s.records = s.records.filter((r) => r._id !== a.payload);
      });
  },
});

export const { clearError: clearVehicleMaintenanceError } = vehicleMaintenanceSlice.actions;
export default vehicleMaintenanceSlice.reducer;

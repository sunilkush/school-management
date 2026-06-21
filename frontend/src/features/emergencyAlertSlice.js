import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const BASE = "/emergency-alerts";

export const fetchEmergencyAlerts = createAsyncThunk("emergency/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(BASE, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch alerts");
  }
});

export const raiseEmergencyAlert = createAsyncThunk("emergency/raise", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(BASE, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to raise alert");
  }
});

export const resolveEmergencyAlert = createAsyncThunk("emergency/resolve", async ({ id, resolution }, { rejectWithValue }) => {
  try {
    const res = await apiClient.patch(`${BASE}/${id}/resolve`, { resolution });
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to resolve alert");
  }
});

export const deleteEmergencyAlert = createAsyncThunk("emergency/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`${BASE}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete alert");
  }
});

const initialState = { alerts: [], total: 0, loading: false, saving: false, error: null };

const emergencyAlertSlice = createSlice({
  name: "emergency",
  initialState,
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmergencyAlerts.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchEmergencyAlerts.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchEmergencyAlerts.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload;
        s.alerts = Array.isArray(d?.alerts) ? d.alerts : Array.isArray(d) ? d : [];
        s.total  = d?.total ?? s.alerts.length;
      })
      .addCase(raiseEmergencyAlert.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(raiseEmergencyAlert.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(raiseEmergencyAlert.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload?._id) s.alerts.unshift(a.payload);
      })
      .addCase(resolveEmergencyAlert.fulfilled, (s, a) => {
        const u = a.payload;
        if (u?._id) s.alerts = s.alerts.map((x) => x._id === u._id ? u : x);
      })
      .addCase(deleteEmergencyAlert.fulfilled, (s, a) => {
        s.alerts = s.alerts.filter((x) => x._id !== a.payload);
      });
  },
});

export const { clearError: clearEmergencyError } = emergencyAlertSlice.actions;
export default emergencyAlertSlice.reducer;

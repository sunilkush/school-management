import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Biometric / RFID attendance readers: the devices, who each card belongs to, and the raw scans.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`attendanceDevice/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchDevices = thunk(
  "fetchDevices",
  () => apiClient.get("/attendance-devices"),
  "Failed to load the devices"
);

export const registerDevice = thunk(
  "registerDevice",
  (payload) => apiClient.post("/attendance-devices", payload),
  "Failed to register the device"
);

export const updateDevice = thunk(
  "updateDevice",
  ({ id, ...payload }) => apiClient.put(`/attendance-devices/${id}`, payload),
  "Failed to update the device"
);

export const rotateSecret = thunk(
  "rotateSecret",
  (id) => apiClient.post(`/attendance-devices/${id}/rotate-secret`, {}),
  "Failed to rotate the secret"
);

export const deleteDevice = thunk(
  "deleteDevice",
  (id) => apiClient.delete(`/attendance-devices/${id}`),
  "Failed to delete the device"
);

export const fetchCredentials = thunk(
  "fetchCredentials",
  (params = {}) => apiClient.get("/attendance-devices/credentials", { params }),
  "Failed to load the enrolled cards"
);

export const enrolCredential = thunk(
  "enrolCredential",
  (payload) => apiClient.post("/attendance-devices/credentials", payload),
  "Failed to enrol the card"
);

export const revokeCredential = thunk(
  "revokeCredential",
  (id) => apiClient.delete(`/attendance-devices/credentials/${id}`),
  "Failed to revoke the card"
);

export const fetchPunchLog = thunk(
  "fetchPunchLog",
  (params = {}) => apiClient.get("/attendance-devices/logs", { params }),
  "Failed to load the scan log"
);

export const fetchUnmatched = thunk(
  "fetchUnmatched",
  (params = {}) => apiClient.get("/attendance-devices/unmatched", { params }),
  "Failed to load the unknown cards"
);

export const replayUnmatched = thunk(
  "replayUnmatched",
  (payload = {}) => apiClient.post("/attendance-devices/replay", payload),
  "Failed to reprocess the scans"
);

export const fetchDeviceSummary = thunk(
  "fetchDeviceSummary",
  (params = {}) => apiClient.get("/attendance-devices/summary", { params }),
  "Failed to load the summary"
);

const initialState = {
  devices: [],
  devicesLoading: false,
  credentials: [],
  credentialsLoading: false,
  punches: [],
  punchesLoading: false,
  unmatched: [],
  unmatchedLoading: false,
  summary: null,
  summaryLoading: false,
  // Shown once, right after registration or a rotation. Never fetchable again — the server
  // does not hand a secret back a second time.
  newCredentials: null,
  actionLoading: false,
  error: null,
};

const attendanceDeviceSlice = createSlice({
  name: "attendanceDevice",
  initialState,
  reducers: {
    clearNewCredentials: (state) => { state.newCredentials = null; },
  },
  extraReducers: (builder) => {
    const loadInto = (t, key, loadingKey) => {
      builder
        .addCase(t.pending, (state) => { state[loadingKey] = true; state.error = null; })
        .addCase(t.fulfilled, (state, action) => {
          state[loadingKey] = false;
          state[key] = action.payload ?? initialState[key];
        })
        .addCase(t.rejected, (state, action) => { state[loadingKey] = false; state.error = action.payload; });
    };

    loadInto(fetchDevices, "devices", "devicesLoading");
    loadInto(fetchCredentials, "credentials", "credentialsLoading");
    loadInto(fetchPunchLog, "punches", "punchesLoading");
    loadInto(fetchUnmatched, "unmatched", "unmatchedLoading");
    loadInto(fetchDeviceSummary, "summary", "summaryLoading");

    [updateDevice, deleteDevice, enrolCredential, revokeCredential, replayUnmatched].forEach((t) => {
      builder
        .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
        .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
        .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
    });

    [registerDevice, rotateSecret].forEach((t) => {
      builder
        .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
        .addCase(t.fulfilled, (state, action) => {
          state.actionLoading = false;
          state.newCredentials = {
            deviceKey: action.payload?.deviceKey,
            secret: action.payload?.secret,
            name: action.payload?.device?.name,
          };
        })
        .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
    });
  },
});

export const { clearNewCredentials } = attendanceDeviceSlice.actions;
export default attendanceDeviceSlice.reducer;

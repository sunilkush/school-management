import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getMessage = (error, fallback) => error?.response?.data?.message || fallback;

export const fetchBackupSummary = createAsyncThunk("systemBackup/fetchSummary", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/system-backups/summary");
    return response.data?.data || {};
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to load backup summary"));
  }
});

export const createManualBackup = createAsyncThunk("systemBackup/createManual", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/system-backups/manual", payload);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to create backup"));
  }
});

export const fetchBackups = createAsyncThunk("systemBackup/fetchBackups", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/system-backups");
    return {
      items: response.data?.data || [],
      meta: response.data?.meta || {},
    };
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to load backups"));
  }
});

export const deleteBackup = createAsyncThunk("systemBackup/deleteBackup", async (backupId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/system-backups/${backupId}`);
    return backupId;
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to delete backup"));
  }
});

export const fetchBackupSchedules = createAsyncThunk("systemBackup/fetchSchedules", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/backup-schedules");
    return response.data?.data || [];
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to load schedules"));
  }
});

export const createBackupSchedule = createAsyncThunk("systemBackup/createSchedule", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/backup-schedules", payload);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to create schedule"));
  }
});

export const toggleBackupSchedule = createAsyncThunk(
  "systemBackup/toggleSchedule",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/backup-schedules/${id}`, { isActive });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getMessage(error, "Failed to update schedule"));
    }
  }
);

export const deleteBackupSchedule = createAsyncThunk(
  "systemBackup/deleteSchedule",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/backup-schedules/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getMessage(error, "Failed to delete schedule"));
    }
  }
);

export const fetchRestoreJobs = createAsyncThunk("systemBackup/fetchRestoreJobs", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/restore-jobs");
    return response.data?.data || [];
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to load restore jobs"));
  }
});

export const requestRestoreJob = createAsyncThunk("systemBackup/requestRestore", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/restore-jobs/request", payload);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to request restore"));
  }
});

export const approveRestoreJob = createAsyncThunk(
  "systemBackup/approveRestore",
  async ({ id, mfaToken }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/restore-jobs/${id}/approve`, { mfaToken });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getMessage(error, "Failed to approve restore"));
    }
  }
);

export const runRestoreJob = createAsyncThunk("systemBackup/runRestore", async (id, { rejectWithValue }) => {
  try {
    const response = await apiClient.post(`/restore-jobs/${id}/run`);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to run restore"));
  }
});

export const fetchBackupAuditLogs = createAsyncThunk("systemBackup/fetchAuditLogs", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/system-backups/audit-logs");
    return response.data?.data || [];
  } catch (error) {
    return rejectWithValue(getMessage(error, "Failed to load audit logs"));
  }
});

export const downloadBackup = createAsyncThunk(
  "systemBackup/download",
  async ({ backupId, backupNo }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/system-backups/${backupId}/download`, {
        responseType: "blob",
      });
      // Trigger browser download
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/json" }));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `${backupNo || backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { backupId };
    } catch (error) {
      return rejectWithValue(getMessage(error, "Failed to download backup file"));
    }
  }
);

// Keep old name so existing imports don't break
export const getBackupDownloadLink = downloadBackup;

const initialState = {
  summary: {},
  backups: [],
  schedules: [],
  restoreJobs: [],
  auditLogs: [],
  pagination: {},
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
  downloadLink: null,
};

const systemBackupSlice = createSlice({
  name: "systemBackup",
  initialState,
  reducers: {
    clearSystemBackupMessages: (state) => {
      state.error = null;
      state.successMessage = null;
      state.downloadLink = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBackupSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(fetchBackups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBackups.fulfilled, (state, action) => {
        state.loading = false;
        state.backups = action.payload.items;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchBackups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createManualBackup.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createManualBackup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = "Backup created successfully";
        state.backups = [action.payload, ...state.backups];
      })
      .addCase(createManualBackup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteBackup.fulfilled, (state, action) => {
        state.backups = state.backups.filter((item) => item._id !== action.payload);
        state.successMessage = "Backup deleted successfully";
      })
      .addCase(fetchBackupSchedules.fulfilled, (state, action) => {
        state.schedules = action.payload;
      })
      .addCase(createBackupSchedule.fulfilled, (state, action) => {
        state.schedules = [action.payload, ...state.schedules];
        state.successMessage = "Schedule created successfully";
      })
      .addCase(toggleBackupSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(deleteBackupSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter((item) => item._id !== action.payload);
        state.successMessage = "Schedule deleted successfully";
      })
      .addCase(fetchRestoreJobs.fulfilled, (state, action) => {
        state.restoreJobs = action.payload;
      })
      .addCase(requestRestoreJob.fulfilled, (state, action) => {
        state.restoreJobs = [action.payload, ...state.restoreJobs];
        state.successMessage = "Restore requested";
      })
      .addCase(approveRestoreJob.fulfilled, (state, action) => {
        state.restoreJobs = state.restoreJobs.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(runRestoreJob.fulfilled, (state, action) => {
        state.restoreJobs = state.restoreJobs.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(fetchBackupAuditLogs.fulfilled, (state, action) => {
        state.auditLogs = action.payload;
      })
      .addCase(getBackupDownloadLink.fulfilled, (state, action) => {
        state.downloadLink = action.payload;
      })
      .addMatcher(
        (action) => action.type.startsWith("systemBackup/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload || "Request failed";
          state.actionLoading = false;
          state.loading = false;
        }
      );
  },
});

export const { clearSystemBackupMessages } = systemBackupSlice.actions;
export default systemBackupSlice.reducer;

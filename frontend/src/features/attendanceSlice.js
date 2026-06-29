import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const initialFilters = {
  schoolId: null,
  classId: null,
  sectionId: null,
  subjectId: null,
  date: null,
  role: null,
  userId: null,
  search: "",
  page: 1,
  limit: 20,
};

export const markBulkAttendance = createAsyncThunk(
  "attendance/markBulkAttendance",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/attendance/mark-bulk", payload);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark attendance");
    }
  }
);


export const submitAttendance = markBulkAttendance;

export const fetchAttendance = createAsyncThunk(
  "attendance/fetchAttendance",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const stateFilters = getState().attendance.filters;
      const merged = { ...stateFilters, ...params };
      const cleaned = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== null && v !== ""));
      const res = await apiClient.get("/attendance", { params: cleaned });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch attendance");
    }
  }
);

export const fetchMonthlyReport = createAsyncThunk(
  "attendance/fetchMonthlyReport",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/attendance/report/monthly", { params });
      return res.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch monthly report");
    }
  }
);


export const fetchMonthlyAttendance = createAsyncThunk(
  "attendance/fetchMonthlyAttendance",
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const result = await dispatch(fetchMonthlyReport(params)).unwrap();
      return result;
    } catch (error) {
      return rejectWithValue(error || "Failed to fetch monthly attendance");
    }
  }
);

export const fetchMyAttendance = createAsyncThunk(
  "attendance/fetchMyAttendance",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/attendance/my", { params });
      return res.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch my attendance");
    }
  }
);

export const updateAttendanceRecord = createAsyncThunk(
  "attendance/updateAttendanceRecord",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/attendance/${id}`, payload);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update attendance");
    }
  }
);

/* ── Self Attendance (GPS) ── */
export const fetchSelfStatus = createAsyncThunk(
  "attendance/fetchSelfStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/attendance/self/status");
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed");
    }
  }
);

export const selfCheckIn = createAsyncThunk(
  "attendance/selfCheckIn",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/attendance/self/check-in", payload);
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Check-in failed");
    }
  }
);

export const selfCheckOut = createAsyncThunk(
  "attendance/selfCheckOut",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/attendance/self/check-out", payload);
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Check-out failed");
    }
  }
);

export const fetchSelfHistory = createAsyncThunk(
  "attendance/fetchSelfHistory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/attendance/self/history", { params });
      return res.data?.data || [];
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed");
    }
  }
);

export const fetchGeofenceSettings = createAsyncThunk(
  "attendance/fetchGeofenceSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/attendance/self/geofence");
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed");
    }
  }
);

export const updateGeofenceSettings = createAsyncThunk(
  "attendance/updateGeofenceSettings",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/attendance/self/geofence", payload);
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed");
    }
  }
);

export const fetchLiveDashboard = createAsyncThunk(
  "attendance/fetchLiveDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/attendance/self/live-dashboard");
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed");
    }
  }
);

export const deleteAttendanceRecord = createAsyncThunk(
  "attendance/deleteAttendanceRecord",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/attendance/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete attendance");
    }
  }
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    filters: initialFilters,
    list: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    monthlyReport: [],
    monthlyAttendance: [],
    myAttendance: [],
    draftRecords: {},
    loading: false,
    reportLoading: false,
    error: null,
    successMessage: null,
    selfStatus: null,
    selfHistory: [],
    selfLoading: false,
    geofenceSettings: null,
    liveDashboard: null,
  },
  reducers: {
    setAttendanceFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetAttendanceFilters: (state) => {
      state.filters = initialFilters;
    },
    setDraftAttendanceStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.draftRecords[userId] = status;
    },
    setBulkDraftStatus: (state, action) => {
      const { userIds, status } = action.payload;
      userIds.forEach((id) => {
        state.draftRecords[id] = status;
      });
    },
    resetDraftAttendance: (state) => {
      state.draftRecords = {};
    },
    clearAttendanceFeedback: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    markAttendance: (state, action) => {
      state.successMessage = action.payload?.message || "Attendance action queued";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(markBulkAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markBulkAttendance.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Attendance saved successfully";
      })
      .addCase(markBulkAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.items || [];
        state.pagination = action.payload?.pagination || state.pagination;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMonthlyReport.pending, (state) => {
        state.reportLoading = true;
      })
      .addCase(fetchMonthlyReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.monthlyReport = action.payload;
      })
      .addCase(fetchMonthlyReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyAttendance = (action.payload || []).map((item) => ({
          userId: item.userId,
          student: { name: item.name },
          present: item.presentDays || item.statusBreakdown?.present || 0,
          absent: item.statusBreakdown?.absent || 0,
          dailyStatus: item.dailyStatus || {},
        }));
      })
      .addCase(fetchMyAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.myAttendance = action.payload;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAttendanceRecord.fulfilled, (state, action) => {
        state.list = state.list.map((item) => (item._id === action.payload._id ? action.payload : item));
      })
      .addCase(deleteAttendanceRecord.fulfilled, (state, action) => {
        state.list = state.list.filter((item) => item._id !== action.payload);
      })
      .addCase(fetchSelfStatus.pending, (state) => { state.selfLoading = true; })
      .addCase(fetchSelfStatus.fulfilled, (state, action) => {
        state.selfLoading = false;
        state.selfStatus = action.payload?.record;
        state.geofenceSettings = action.payload?.school;
      })
      .addCase(fetchSelfStatus.rejected, (state) => { state.selfLoading = false; })
      .addCase(selfCheckIn.pending, (state) => { state.selfLoading = true; state.error = null; })
      .addCase(selfCheckIn.fulfilled, (state, action) => {
        state.selfLoading = false;
        state.error = null;
        state.selfStatus = action.payload?.record || action.payload;
      })
      .addCase(selfCheckIn.rejected, (state, action) => {
        state.selfLoading = false;
        state.error = action.payload;
      })
      .addCase(selfCheckOut.pending, (state) => { state.selfLoading = true; state.error = null; })
      .addCase(selfCheckOut.fulfilled, (state, action) => {
        state.selfLoading = false;
        state.error = null;
        state.selfStatus = action.payload?.record;
      })
      .addCase(selfCheckOut.rejected, (state, action) => {
        state.selfLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSelfHistory.fulfilled, (state, action) => {
        state.selfHistory = action.payload;
      })
      .addCase(fetchGeofenceSettings.fulfilled, (state, action) => {
        state.geofenceSettings = action.payload;
      })
      .addCase(updateGeofenceSettings.fulfilled, (state, action) => {
        state.geofenceSettings = action.payload;
      })
      .addCase(fetchLiveDashboard.fulfilled, (state, action) => {
        state.liveDashboard = action.payload;
      });
  },
});

export const {
  setAttendanceFilters,
  resetAttendanceFilters,
  setDraftAttendanceStatus,
  setBulkDraftStatus,
  resetDraftAttendance,
  clearAttendanceFeedback,
  markAttendance,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;

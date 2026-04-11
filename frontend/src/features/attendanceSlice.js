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

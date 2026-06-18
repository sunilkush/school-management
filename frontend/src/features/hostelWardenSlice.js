import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getMsg = (err, fb) => err?.response?.data?.message || err?.message || fb;

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const fetchHostelDashboard = createAsyncThunk(
  "hostelWarden/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/dashboard/hostel-warden/overview");
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch dashboard")); }
  }
);

// ── Leave Management ───────────────────────────────────────────────────────────
export const fetchHostelLeaves = createAsyncThunk(
  "hostelWarden/fetchLeaves",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/hostel/leaves", { params });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch leaves")); }
  }
);

export const createHostelLeave = createAsyncThunk(
  "hostelWarden/createLeave",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/hostel/leaves", payload);
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to create leave")); }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  "hostelWarden/updateLeaveStatus",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/hostel/leaves/${id}/status`, payload);
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to update leave")); }
  }
);

export const recordLeaveCheckOut = createAsyncThunk(
  "hostelWarden/leaveCheckOut",
  async ({ id, checkOutTime }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/hostel/leaves/${id}/checkout`, { checkOutTime });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to record checkout")); }
  }
);

export const recordLeaveCheckIn = createAsyncThunk(
  "hostelWarden/leaveCheckIn",
  async ({ id, checkInTime }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/hostel/leaves/${id}/checkin`, { checkInTime });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to record checkin")); }
  }
);

export const deleteHostelLeave = createAsyncThunk(
  "hostelWarden/deleteLeave",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/hostel/leaves/${id}`);
      return id;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to delete leave")); }
  }
);

// ── Visitor Management ─────────────────────────────────────────────────────────
export const fetchHostelVisitors = createAsyncThunk(
  "hostelWarden/fetchVisitors",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/hostel/visitors", { params });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch visitors")); }
  }
);

export const createVisitorEntry = createAsyncThunk(
  "hostelWarden/createVisitor",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/hostel/visitors", payload);
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to log visitor")); }
  }
);

export const markVisitorExit = createAsyncThunk(
  "hostelWarden/visitorExit",
  async ({ id, exitTime }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/hostel/visitors/${id}/exit`, { exitTime });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to mark exit")); }
  }
);

export const deleteVisitorEntry = createAsyncThunk(
  "hostelWarden/deleteVisitor",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/hostel/visitors/${id}`);
      return id;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to delete visitor")); }
  }
);

// ── Complaint Management ───────────────────────────────────────────────────────
export const fetchHostelComplaints = createAsyncThunk(
  "hostelWarden/fetchComplaints",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/hostel/complaints", { params });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch complaints")); }
  }
);

export const createHostelComplaint = createAsyncThunk(
  "hostelWarden/createComplaint",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/hostel/complaints", payload);
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to create complaint")); }
  }
);

export const updateHostelComplaint = createAsyncThunk(
  "hostelWarden/updateComplaint",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/hostel/complaints/${id}`, payload);
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to update complaint")); }
  }
);

export const deleteHostelComplaint = createAsyncThunk(
  "hostelWarden/deleteComplaint",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/hostel/complaints/${id}`);
      return id;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to delete complaint")); }
  }
);

// ── Hostel Attendance ──────────────────────────────────────────────────────────
export const fetchAttendanceSheet = createAsyncThunk(
  "hostelWarden/fetchAttendanceSheet",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/hostel/attendance/today", { params });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch attendance sheet")); }
  }
);

export const fetchHostelAttendance = createAsyncThunk(
  "hostelWarden/fetchAttendance",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/hostel/attendance", { params });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch attendance")); }
  }
);

export const markHostelAttendance = createAsyncThunk(
  "hostelWarden/markAttendance",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/hostel/attendance", payload);
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to mark attendance")); }
  }
);

export const fetchAttendanceSummary = createAsyncThunk(
  "hostelWarden/attendanceSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/hostel/attendance/summary", { params });
      return res.data.data;
    } catch (err) { return rejectWithValue(getMsg(err, "Failed to fetch summary")); }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────
const MUTATION_PREFIXES = [
  "hostelWarden/createLeave", "hostelWarden/updateLeaveStatus",
  "hostelWarden/leaveCheckOut", "hostelWarden/leaveCheckIn", "hostelWarden/deleteLeave",
  "hostelWarden/createVisitor", "hostelWarden/visitorExit", "hostelWarden/deleteVisitor",
  "hostelWarden/createComplaint", "hostelWarden/updateComplaint", "hostelWarden/deleteComplaint",
  "hostelWarden/markAttendance",
];

const isMutation = (type) => MUTATION_PREFIXES.some((p) => type.startsWith(p));

const hostelWardenSlice = createSlice({
  name: "hostelWarden",
  initialState: {
    dashboard: null,
    dashboardLoading: false,

    leaves: [], leavesTotal: 0, leavesSummary: [], leavesLoading: false,
    visitors: [], visitorsTotal: 0, visitorsToday: 0, visitorsLoading: false,
    complaints: [], complaintsTotal: 0, complaintsSummary: [], complaintsLoading: false,
    attendanceSheet: null, attendanceRecords: [], attendanceTotal: 0,
    attendanceSummary: [], attendanceLoading: false,

    actionLoading: false,
    error: null,
  },
  reducers: {
    clearHostelWardenError: (s) => { s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchHostelDashboard.pending,   (s) => { s.dashboardLoading = true; })
      .addCase(fetchHostelDashboard.fulfilled, (s, a) => { s.dashboardLoading = false; s.dashboard = a.payload; })
      .addCase(fetchHostelDashboard.rejected,  (s, a) => { s.dashboardLoading = false; s.error = a.payload; })
      // Leaves
      .addCase(fetchHostelLeaves.pending,   (s) => { s.leavesLoading = true; })
      .addCase(fetchHostelLeaves.fulfilled, (s, a) => {
        s.leavesLoading = false;
        s.leaves        = a.payload?.leaves || [];
        s.leavesTotal   = a.payload?.total  || 0;
        s.leavesSummary = a.payload?.summary || [];
      })
      .addCase(fetchHostelLeaves.rejected,  (s, a) => { s.leavesLoading = false; s.error = a.payload; })
      // Visitors
      .addCase(fetchHostelVisitors.pending,   (s) => { s.visitorsLoading = true; })
      .addCase(fetchHostelVisitors.fulfilled, (s, a) => {
        s.visitorsLoading = false;
        s.visitors        = a.payload?.visitors || [];
        s.visitorsTotal   = a.payload?.total || 0;
        s.visitorsToday   = a.payload?.visitorsToday || 0;
      })
      .addCase(fetchHostelVisitors.rejected,  (s, a) => { s.visitorsLoading = false; s.error = a.payload; })
      // Complaints
      .addCase(fetchHostelComplaints.pending,   (s) => { s.complaintsLoading = true; })
      .addCase(fetchHostelComplaints.fulfilled, (s, a) => {
        s.complaintsLoading = false;
        s.complaints        = a.payload?.complaints || [];
        s.complaintsTotal   = a.payload?.total || 0;
        s.complaintsSummary = a.payload?.summary || [];
      })
      .addCase(fetchHostelComplaints.rejected,  (s, a) => { s.complaintsLoading = false; s.error = a.payload; })
      // Attendance Sheet
      .addCase(fetchAttendanceSheet.pending,   (s) => { s.attendanceLoading = true; })
      .addCase(fetchAttendanceSheet.fulfilled, (s, a) => { s.attendanceLoading = false; s.attendanceSheet = a.payload; })
      .addCase(fetchAttendanceSheet.rejected,  (s, a) => { s.attendanceLoading = false; s.error = a.payload; })
      // Attendance Records
      .addCase(fetchHostelAttendance.pending,   (s) => { s.attendanceLoading = true; })
      .addCase(fetchHostelAttendance.fulfilled, (s, a) => {
        s.attendanceLoading  = false;
        s.attendanceRecords  = a.payload?.records || [];
        s.attendanceTotal    = a.payload?.total   || 0;
      })
      .addCase(fetchHostelAttendance.rejected,  (s, a) => { s.attendanceLoading = false; s.error = a.payload; })
      // Attendance Summary
      .addCase(fetchAttendanceSummary.fulfilled, (s, a) => { s.attendanceSummary = a.payload || []; })
      // Mutation loading via matcher
      .addMatcher(
        (action) => isMutation(action.type) && action.type.endsWith("/pending"),
        (s) => { s.actionLoading = true; s.error = null; }
      )
      .addMatcher(
        (action) => isMutation(action.type) && (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")),
        (s, a) => {
          s.actionLoading = false;
          if (a.type.endsWith("/rejected")) s.error = a.payload;
        }
      );
  },
});

export const { clearHostelWardenError } = hostelWardenSlice.actions;
export default hostelWardenSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("accessToken");
// ================== Async Thunks ==================

// 📌 Fetch Students for Attendance
export const fetchStudents = createAsyncThunk(
  "attendance/fetchStudents",
  async ({ classId, sectionId, date }, { rejectWithValue }) => {
    try {
      
      const res = await axios.get(`${API_URL}/attendance/students`, {
        params: { classId, sectionId, date },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 📌 Fetch Teachers for Attendance
export const fetchTeachers = createAsyncThunk(
  "attendance/fetchTeachers",
  async ({ departmentId, subjectId, date }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/attendance/teachers`, {
        params: { departmentId, subjectId, date },
        headers: { Authorization: `Bearer ${token}` }
         
      }      
    );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 📌 Submit Attendance
export const submitAttendance = createAsyncThunk(
  "attendance/submit",
  async ({ records, role, date, classId, sectionId, departmentId, subjectId,schoolId,academicYearId,userId }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/attendance/mark`, {
        records,
        role,
        date,
        classId,
        sectionId,
        departmentId,
        subjectId,
        schoolId,
        academicYearId,
        userId
        
      },
      {headers: { Authorization: `Bearer ${token}` }}
    );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 📌 Fetch Reports (Daily, Monthly, Class-Monthly)
export const fetchReports = createAsyncThunk(
  "attendance/fetchReports",
  async ({ reportType, date, classId, sectionId }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/attendance/reports`, {
        params: { reportType, date, classId, sectionId },
      }
      ,{headers: { Authorization: `Bearer ${token}` }});
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ================== Slice ==================
const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    filters: {
      classId: null,
      sectionId: null,
      departmentId: null,
      subjectId: null,
      date: new Date().toISOString().split("T")[0],
      reportType: null,
    },
    students: [],
    teachers: [],
    records: {}, // { userId: "Present" }
    reports: [],
    loading: false,
    error: null,
  },
  reducers: {
    // 📌 Set Filters
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // 📌 Mark single attendance
    markAttendance: (state, action) => {
      const { id, status } = action.payload;
      state.records[id] = status;
    },
    // 📌 Bulk Mark
    bulkMark: (state, action) => {
      const { ids, status } = action.payload;
      ids.forEach((id) => {
        state.records[id] = status;
      });
    },
    // 📌 Reset State
    resetAttendance: (state) => {
      state.records = {};
    },
  },
  extraReducers: (builder) => {
    // ===== Students =====
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload || [];
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== Teachers =====
    builder
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload || [];
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== Submit =====
    builder
      .addCase(submitAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAttendance.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ===== Reports =====
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload || [];
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ================== Exports ==================
export const { setFilter, markAttendance, bulkMark, resetAttendance } =
  attendanceSlice.actions;

export default attendanceSlice.reducer;

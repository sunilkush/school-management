
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";
import memoryStorage from "../utils/memoryStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ----------------- Async thunks -----------------

// Exam report
export const fetchExamReport = createAsyncThunk(
  "reports/fetchExamReport",
  async (examId, { rejectWithValue }) => {
    try {
      
     const res = await apiClient.get(`${API_BASE_URL}/exam-report/exam/${examId}`, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Student report
export const fetchStudentReport = createAsyncThunk(
  "reports/fetchStudentReport",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`${API_BASE_URL}/exam-report/student/${studentId}`, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Overall report
export const fetchOverallReport = createAsyncThunk(
  "reports/fetchOverallReport",
  async (_, { rejectWithValue }) => {
    try {
     const res = await apiClient.get(`${API_BASE_URL}/exam-report`, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Reports (list with filters)
export const fetchReports = createAsyncThunk(
  "reports/fetchReports",
  async (filters, { rejectWithValue }) => {
    try {
     const res = await apiClient.get(`${API_BASE_URL}/exam-report`, {
        params: filters,      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Export Excel
export const exportReportExcel = createAsyncThunk(
  "reports/exportExcel",
  async (filters, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`${API_BASE_URL}/exam-report/export/excel`, {
        params: filters,        responseType: "blob", // required for file
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Export PDF
export const exportReportPDF = createAsyncThunk(
  "reports/exportPDF",
  async (filters, { rejectWithValue }) => {
    try {
       const res = await apiClient.get(`${API_BASE_URL}/exam-report/export/pdf`, {
        params: filters,        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ----------------- Slice -----------------
const reportSlice = createSlice({
  name: "reports",
  initialState: {
    reports: [],          // <-- added to fix missing state
    examReport: null,
    studentReport: null,
    overallReport: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearReports: (state) => {
      state.reports = [];
      state.examReport = null;
      state.studentReport = null;
      state.overallReport = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Exam report
      .addCase(fetchExamReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamReport.fulfilled, (state, action) => {
        state.loading = false;
        state.examReport = action.payload;
      })
      .addCase(fetchExamReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Student report
      .addCase(fetchStudentReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentReport.fulfilled, (state, action) => {
        state.loading = false;
        state.studentReport = action.payload;
      })
      .addCase(fetchStudentReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Overall report
      .addCase(fetchOverallReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOverallReport.fulfilled, (state, action) => {
        state.loading = false;
        state.overallReport = action.payload;
      })
      .addCase(fetchOverallReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Export Excel
      .addCase(exportReportExcel.pending, (state) => {
        state.loading = true;
      })
      .addCase(exportReportExcel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportReportExcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Export PDF
      .addCase(exportReportPDF.pending, (state) => {
        state.loading = true;
      })
      .addCase(exportReportPDF.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportReportPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;

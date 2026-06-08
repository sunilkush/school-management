import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from "../api/httpClient";
import qs from 'qs';

const unwrapApiEnvelope = (payload) => {
  let current = payload;

  while (
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    Object.prototype.hasOwnProperty.call(current, 'data') &&
    Object.prototype.hasOwnProperty.call(current, 'success')
  ) {
    current = current.data;
  }

  return current;
};

const normalizeReports = (payload) => {
  const data = unwrapApiEnvelope(payload);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

// Get all reports with filters
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (filters = {}, { rejectWithValue }) => {
    try {
      // Remove empty values
      const cleaned = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value != null)
      );

      const query = qs.stringify(cleaned, { addQueryPrefix: true });

      const res = await apiClient.get(`/report/getReport${query}`);

      return normalizeReports(res.data?.data ?? res.data);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Create report
export const createReport = createAsyncThunk(
  'reports/createReport',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/report/create`, payload);

      return unwrapApiEnvelope(res.data?.data ?? res.data);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Delete Report
export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/report/delete/${id}`);

      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// View report
export const reportView = createAsyncThunk(
  'reports/reportView',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/report/view/${id}`);

      return unwrapApiEnvelope(res.data?.data ?? res.data);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Fetch School Reports (FIXED URL)
export const fetchSchoolReports = createAsyncThunk(
  "reports/fetchSchoolReports",
  async ({ schoolId, academicYearId }, { rejectWithValue }) => {
    try {

      const res = await apiClient.get(
        `/report/school/${schoolId}/academic-year/${academicYearId}`,
      );
       
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);


const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    items: [],
    reports: [],
    schoolReports: [], // FIXED
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = normalizeReports(action.payload);
        state.reports = state.items;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          (typeof action.payload === 'string' ? action.payload : null) ||
          'Failed to fetch reports';
      })

      // Create Report
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.unshift(action.payload);
          state.reports = state.items;
        }
      })

      // Delete Report
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((r) => r._id !== action.payload);
        state.reports = state.items;
      })

      // View Report
      .addCase(reportView.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        state.reports = state.items;
      })

      .addCase(fetchSchoolReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchoolReports.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolReports = action.payload || [];
      })
      .addCase(fetchSchoolReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch school reports";
      });

  },
});

export default reportSlice.reducer;

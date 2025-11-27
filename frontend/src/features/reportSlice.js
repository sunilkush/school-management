import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import qs from 'qs';

const App_Base_Url = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('accessToken');

// Get all reports with filters
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (filters = {}, { rejectWithValue }) => {
    try {
      // Remove empty values
      const cleaned = Object.fromEntries(
        Object.entries(filters).filter(([v]) => v !== '' && v != null)
      );

      const query = qs.stringify(cleaned, { addQueryPrefix: true });

      const res = await axios.get(`${App_Base_Url}/report/getReport${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data.data || [];
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
      const res = await axios.post(`${App_Base_Url}/report/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data.data;
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
      await axios.delete(`${App_Base_Url}/report/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const res = await axios.get(`${App_Base_Url}/report/view/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data.data;
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
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(
        `${App_Base_Url}/report/school/${schoolId}/academic-year/${academicYearId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
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
        state.items = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch reports';
      })

      // Create Report
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })

      // Delete Report
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((r) => r._id !== action.payload);
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

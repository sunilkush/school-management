import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import qs from 'qs';
const  App_Base_Url = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('accessToken');
// fetchReports accepts an object of filters: { school, type, session, dateFrom, dateTo }
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (filters = {}, { rejectWithValue }) => {
    try {
      // build query params, remove empty
      
      const cleaned = Object.entries(filters || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = v;
        return acc;
      }, {});
      const query = qs.stringify(cleaned, { addQueryPrefix: true });
      const res = await axios.get(`${App_Base_Url}/report/getReport${query}`,{
         headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);
// createReport accepts the report data
export const createReport = createAsyncThunk(
  'reports/createReport',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${App_Base_Url}/report/create`, payload,{
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);
// deleteReport accepts the report ID to delete
export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${App_Base_Url}/report/delete/${id}`,{
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const reportView = createAsyncThunk('reports/reportView', async(id, { rejectWithValue }) => {
  try {
    
    const res = await axios.get(`${App_Base_Url}/report/view/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
})


// Report slice to manage reports state
const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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

      .addCase(createReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create report';
      })

      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete report';
      })

      .addCase(reportView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reportView.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload; // update existing report
        } else {
          state.items.push(action.payload); // or add new report
        }
      })
      .addCase(reportView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to view report';
      })
  }
});

export default reportSlice.reducer;
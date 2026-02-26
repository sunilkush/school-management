// features/activitySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Base URL (adjust if needed)
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ✅ Fetch activity logs with optional filters
export const fetchActivityLogs = createAsyncThunk(
  "activity/fetchLogs",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const { data } = await axios.get(`${API_BASE_URL}/activity-logs?${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      return data.data; // logs array
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ Create a new activity log
export const createActivityLog = createAsyncThunk(
  "activity/createLog",
  async (logData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/activity-logs`, logData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ Delete an activity log
export const deleteActivityLog = createAsyncThunk(
  "activity/deleteLog",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/activity-logs/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      return id; // return deleted log id for local state update
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const activitySlice = createSlice({
  name: "activity",
  initialState: {
    logs: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch logs
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create log
      .addCase(createActivityLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createActivityLog.fulfilled, (state, action) => {
        state.loading = false;
        state.logs.unshift(action.payload); // add new log to top
      })
      .addCase(createActivityLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete log
      .addCase(deleteActivityLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteActivityLog.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = state.logs.filter((log) => log._id !== action.payload);
      })
      .addCase(deleteActivityLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default activitySlice.reducer;

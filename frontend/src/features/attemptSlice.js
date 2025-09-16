import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// --- Async Thunks --- //

// Start a new attempt
export const startAttempt = createAsyncThunk(
  "attempts/startAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/attempts/start`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Submit an attempt
export const submitAttempt = createAsyncThunk(
  "attempts/submitAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/attempts/submit`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Evaluate subjective answers (teacher)
export const evaluateAttempt = createAsyncThunk(
  "attempts/evaluateAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/attempts/evaluate`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get single attempt
export const getAttemptById = createAsyncThunk(
  "attempts/getAttemptById",
  async (attemptId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/attempts/${attemptId}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get all attempts (filters + pagination)
export const getAttempts = createAsyncThunk(
  "attempts/getAttempts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`${API_BASE_URL}/attempts?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Slice --- //
const attemptSlice = createSlice({
  name: "attempts",
  initialState: {
    attempts: [],
    currentAttempt: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentAttempt: (state) => {
      state.currentAttempt = null;
      state.error = null;
    },
    clearAttemptsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Start Attempt ---
      .addCase(startAttempt.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(startAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(startAttempt.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Submit Attempt ---
      .addCase(submitAttempt.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(submitAttempt.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Evaluate Attempt ---
      .addCase(evaluateAttempt.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(evaluateAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(evaluateAttempt.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Get Single Attempt ---
      .addCase(getAttemptById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAttemptById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(getAttemptById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Get All Attempts ---
      .addCase(getAttempts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAttempts.fulfilled, (state, action) => {
        state.loading = false;
        state.attempts = action.payload;
      })
      .addCase(getAttempts.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearCurrentAttempt, clearAttemptsError } = attemptSlice.actions;
export default attemptSlice.reducer;

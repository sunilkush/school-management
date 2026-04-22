import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";



// --- Async Thunks --- //

// Start a new attempt
export const startAttempt = createAsyncThunk(
  "attempts/startAttempt",
  async ({ examId, schoolId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/attempt/start`, { examId, schoolId });
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
      const res = await apiClient.post(`/attempt/submit`, payload);
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
      const res = await apiClient.post(`/attempt/evaluate`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get single attempt
export const getAttemptById = createAsyncThunk(
  "attempts/getAttemptById",
  async (attemptIdInput, { rejectWithValue }) => {
    try {
      const attemptId =
        typeof attemptIdInput === "object" && attemptIdInput !== null
          ? attemptIdInput.attemptId || attemptIdInput.id
          : attemptIdInput;
      if (!attemptId) throw new Error("Invalid attempt id");
      const res = await apiClient.get(`/attempt/${attemptId}`);
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
      const res = await apiClient.get(`/attempt?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const autosaveAnswer = createAsyncThunk(
  "attempts/autosaveAnswer",
  async ({ attemptId, questionId, answer, flagged = false }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/attempt/${attemptId}/answer`, {
        questionId,
        answer,
        flagged,
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getActiveAttemptByExam = createAsyncThunk(
  "attempts/getActiveAttemptByExam",
  async (examId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/attempt/active/${examId}`);
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
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.attempts = payload;
        } else if (Array.isArray(payload?.attempts)) {
          state.attempts = payload.attempts;
        } else if (Array.isArray(payload?.data)) {
          state.attempts = payload.data;
        } else {
          state.attempts = [];
        }
      })
      .addCase(getAttempts.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
      builder
      .addCase(autosaveAnswer.pending, (state) => { state.error = null; })
      .addCase(autosaveAnswer.rejected, (state, action) => { state.error = action.payload; })
      .addCase(getActiveAttemptByExam.fulfilled, (state, action) => {
        if (action.payload) state.currentAttempt = action.payload;
      });
  },
});

export const { clearCurrentAttempt, clearAttemptsError } = attemptSlice.actions;
export default attemptSlice.reducer;

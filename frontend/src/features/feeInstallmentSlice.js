import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ============================
   ASYNC THUNKS
============================ */

/**
 * A student's fee schedule for one academic year: every installment (fine and overdue status as
 * of today), the per-head summary (Fee Head | Amount | Frequency | Yearly), totals per frequency
 * ("Total monthly ₹3,000") and the year's totals.
 */
export const fetchFeeSchedule = createAsyncThunk(
  "feeInstallment/fetchSchedule",
  async ({ studentId, academicYearId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/fee-installments`, { params: { studentId, academicYearId } });
      return { studentId, data: res.data?.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load fee schedule");
    }
  }
);

/**
 * What the chosen installments owe right now, fines included — worked out by the server. Returned
 * to the caller rather than stored: it belongs to one selection on one screen.
 */
export const quoteInstallments = createAsyncThunk(
  "feeInstallment/quote",
  async ({ studentId, installmentIds }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/fee-installments/quote`, { studentId, installmentIds });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to work out the amount due");
    }
  }
);

/** Staff only: builds schedules for fee records assigned before schedules were automatic. */
export const generateMissingSchedules = createAsyncThunk(
  "feeInstallment/generateMissing",
  async ({ studentId, academicYearId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/fee-installments/generate`, { studentId, academicYearId });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to generate installments");
    }
  }
);

/* ============================
   SLICE
============================ */

const EMPTY_SCHEDULE = {
  installments: [],
  heads: [],
  perFrequency: {},
  totals: null,
  settings: null,
};

const feeInstallmentSlice = createSlice({
  name: "feeInstallment",
  initialState: {
    ...EMPTY_SCHEDULE,
    studentId: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearFeeSchedule: (state) => ({ ...state, ...EMPTY_SCHEDULE, studentId: null, error: null }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeeSchedule.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Switching student: never show the previous student's rows while the next load runs.
        if (state.studentId !== action.meta.arg.studentId) Object.assign(state, EMPTY_SCHEDULE);
      })
      .addCase(fetchFeeSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.studentId = action.payload.studentId;
        Object.assign(state, EMPTY_SCHEDULE, action.payload.data || {});
      })
      .addCase(fetchFeeSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFeeSchedule } = feeInstallmentSlice.actions;
export default feeInstallmentSlice.reducer;

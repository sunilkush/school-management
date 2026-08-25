import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ============================
   ASYNC THUNKS
============================ */

// Generate Installments
export const generateInstallments = createAsyncThunk(
  "feeInstallment/generate",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/fee-installments/generate`,
        payload,
        {        }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate installments"
      );
    }
  }
);

// Fetch Installments
export const fetchFeeInstallments = createAsyncThunk(
  "feeInstallment/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/fee-installments`, {        params,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch installments"
      );
    }
  }
);

// Installment payment goes through paymentSlice's createPayment (POST /payments) — see
// backend/src/services/feePayment.service.js — which keeps the installment and its parent
// StudentFee in sync in one call. The old /fee-installments/pay/:installmentId endpoint this
// action hit is gone.

/* ============================
   SLICE
============================ */

const feeInstallmentSlice = createSlice({
  name: "feeInstallment",
  initialState: {
    installments: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetInstallmentState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // GENERATE
      .addCase(generateInstallments.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateInstallments.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.installments = action.payload?.data || [];
      })
      .addCase(generateInstallments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH
      .addCase(fetchFeeInstallments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeeInstallments.fulfilled, (state, action) => {
        state.loading = false;
        state.installments = action.payload?.data || [];
      })
      .addCase(fetchFeeInstallments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetInstallmentState } = feeInstallmentSlice.actions;
export default feeInstallmentSlice.reducer;

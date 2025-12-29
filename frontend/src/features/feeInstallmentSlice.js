import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* ============================
   ASYNC THUNKS
============================ */

// ✅ Generate Installments
export const generateInstallments = createAsyncThunk(
  "feeInstallment/generate",
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${API_BASE_URL}/fee-installments/generate`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate installments"
      );
    }
  }
);

// ✅ Get All Installments (optional)
export const fetchFeeInstallments = createAsyncThunk(
  "feeInstallment/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/fee-installments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch installments"
      );
    }
  }
);

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
      // GENERATE INSTALLMENTS
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

      // FETCH INSTALLMENTS
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

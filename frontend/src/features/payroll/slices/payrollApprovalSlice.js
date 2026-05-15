import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import payrollApi from "../services/payrollApi";

const initialState = {
  list: [],
  data: null,
  selected: null,
  loading: false,
  error: null,
  pagination: { current: 1, pageSize: 10, total: 0 },
  filters: {},
};

export const fetchPayrollApproval = createAsyncThunk("payroll/payrollApproval/fetch", async (params, { rejectWithValue }) => {
  try {
    const res = await payrollApi.getPayrollDashboard(params || {});
    return res?.data?.data || res?.data || {};
  } catch (error) {
    return rejectWithValue(error?.response?.data || { message: error?.message || "Something went wrong" });
  }
});

const payrollApprovalSlice = createSlice({
  name: "payrollApproval",
  initialState,
  reducers: {
    setSelected: (state, action) => { state.selected = action.payload; },
    clearError: (state) => { state.error = null; },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollApproval.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPayrollApproval.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.list = action.payload?.items || action.payload?.list || [];
      })
      .addCase(fetchPayrollApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      });
  },
});

export const { setSelected, clearError, resetState } = payrollApprovalSlice.actions;
export default payrollApprovalSlice.reducer;

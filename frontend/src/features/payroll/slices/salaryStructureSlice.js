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

export const fetchSalaryStructure = createAsyncThunk("payroll/salaryStructure/fetch", async (params, { rejectWithValue }) => {
  try {
    const res = await payrollApi.getPayrollDashboard(params || {});
    return res?.data?.data || res?.data || {};
  } catch (error) {
    return rejectWithValue(error?.response?.data || { message: error?.message || "Something went wrong" });
  }
});

const salaryStructureSlice = createSlice({
  name: "salaryStructure",
  initialState,
  reducers: {
    setSelected: (state, action) => { state.selected = action.payload; },
    clearError: (state) => { state.error = null; },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalaryStructure.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSalaryStructure.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.list = action.payload?.items || action.payload?.list || [];
      })
      .addCase(fetchSalaryStructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      });
  },
});

export const { setSelected, clearError, resetState } = salaryStructureSlice.actions;
export default salaryStructureSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const err = (error, fb) => error?.response?.data?.message || fb;

export const fetchPayrollDashboard = createAsyncThunk("pe/dashboard", async (_, { rejectWithValue }) => {
  try { const { data } = await httpClient.get("/payroll-enterprise/reports/summary"); return data.data; } catch (e) { return rejectWithValue(err(e, "Failed dashboard")); }
});
export const fetchPayrollRuns = createAsyncThunk("pe/runs", async (_, { rejectWithValue }) => {
  try { const { data } = await httpClient.get("/payroll-enterprise/runs"); return data.data || []; } catch (e) { return rejectWithValue(err(e, "Failed runs")); }
});
export const generatePayrollRun = createAsyncThunk("pe/gen", async (payload, { rejectWithValue }) => {
  try { const { data } = await httpClient.post("/payroll-enterprise/run/generate", payload); return data.data; } catch (e) { return rejectWithValue(err(e, "Failed generate")); }
});
export const approvePayrollRun = createAsyncThunk("pe/approve", async (id, { rejectWithValue }) => {
  try { const { data } = await httpClient.post(`/payroll-enterprise/run/${id}/approve`, {}); return data.data; } catch (e) { return rejectWithValue(err(e, "Failed approval")); }
});
export const fetchLoans = createAsyncThunk("pe/loans", async (_, { rejectWithValue }) => {
  try { const { data } = await httpClient.get("/payroll-enterprise/loan"); return data.data || []; } catch (e) { return rejectWithValue(err(e, "Failed loans")); }
});
export const createLoanRequest = createAsyncThunk("pe/loanCreate", async (payload, { rejectWithValue }) => {
  try { const { data } = await httpClient.post("/payroll-enterprise/loan/request", payload); return data.data; } catch (e) { return rejectWithValue(err(e, "Failed loan create")); }
});
export const updateTaxSettings = createAsyncThunk("pe/tax", async (payload, { rejectWithValue }) => {
  try { const { data } = await httpClient.post("/payroll-enterprise/tax-config", payload); return data.data; } catch (e) { return rejectWithValue(err(e, "Failed tax save")); }
});

const slice = createSlice({
  name: "payrollEnterprise",
  initialState: { dashboard: null, runs: [], loans: [], loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPayrollDashboard.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPayrollDashboard.fulfilled, (s, a) => { s.loading = false; s.dashboard = a.payload; })
      .addCase(fetchPayrollDashboard.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchPayrollRuns.fulfilled, (s, a) => { s.runs = a.payload; })
      .addCase(fetchLoans.fulfilled, (s, a) => { s.loans = a.payload; })
      .addCase(generatePayrollRun.pending, (s) => { s.saving = true; })
      .addCase(generatePayrollRun.fulfilled, (s, a) => { s.saving = false; s.runs.unshift(a.payload); })
      .addCase(generatePayrollRun.rejected, (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(createLoanRequest.pending, (s) => { s.saving = true; })
      .addCase(createLoanRequest.fulfilled, (s, a) => { s.saving = false; s.loans.unshift(a.payload); })
      .addCase(createLoanRequest.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export default slice.reducer;

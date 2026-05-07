import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const err = (error, fb) => error?.response?.data?.message || fb;
const replaceById = (items, item) => items.map((row) => (row._id === item?._id ? item : row));

export const fetchPayrollDashboard = createAsyncThunk("pe/dashboard", async (_, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get("/payroll-enterprise/reports/summary");
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed dashboard"));
  }
});

export const fetchPayrollRuns = createAsyncThunk("pe/runs", async (_, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get("/payroll-enterprise/runs");
    return data.data || [];
  } catch (e) {
    return rejectWithValue(err(e, "Failed runs"));
  }
});

export const fetchPayrollRunDetails = createAsyncThunk("pe/runDetails", async (id, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get(`/payroll-enterprise/runs/${id}`);
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed run details"));
  }
});

export const generatePayrollRun = createAsyncThunk("pe/gen", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post("/payroll-enterprise/run/generate", payload);
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed generate"));
  }
});

export const approvePayrollRun = createAsyncThunk("pe/approve", async ({ id, comment }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/run/${id}/approve`, { comment });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed approval"));
  }
});

export const lockPayrollRun = createAsyncThunk("pe/lock", async ({ id, comment }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/run/${id}/lock`, { comment });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed lock"));
  }
});

export const markPayrollPaid = createAsyncThunk("pe/paid", async ({ id, comment }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/run/${id}/pay`, { comment });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed paid update"));
  }
});

export const rollbackPayrollRun = createAsyncThunk("pe/rollback", async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/run/${id}/rollback`, { reason });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed rollback"));
  }
});

export const generateBankTransfer = createAsyncThunk("pe/bankTransfer", async ({ id, format }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/run/${id}/bank-transfer`, { format });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed bank transfer"));
  }
});

export const fetchLoans = createAsyncThunk("pe/loans", async (_, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get("/payroll-enterprise/loan");
    return data.data || [];
  } catch (e) {
    return rejectWithValue(err(e, "Failed loans"));
  }
});

export const createLoanRequest = createAsyncThunk("pe/loanCreate", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post("/payroll-enterprise/loan/request", payload);
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed loan create"));
  }
});

export const approveLoanRequest = createAsyncThunk("pe/loanApprove", async ({ id, comment }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/loan/${id}/approve`, { comment });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed loan approval"));
  }
});

export const rejectLoanRequest = createAsyncThunk("pe/loanReject", async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post(`/payroll-enterprise/loan/${id}/reject`, { reason });
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed loan rejection"));
  }
});

export const fetchTaxSettings = createAsyncThunk("pe/taxFetch", async (_, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get("/payroll-enterprise/tax-config");
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed tax load"));
  }
});

export const fetchReimbursements = createAsyncThunk("pe/reimbursements", async (_, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get("/payroll-enterprise/reimbursements");
    return data.data || [];
  } catch (e) {
    return rejectWithValue(err(e, "Failed reimbursements"));
  }
});

export const fetchComplianceFilings = createAsyncThunk("pe/compliance", async (_, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.get("/payroll-enterprise/compliance");
    return data.data || [];
  } catch (e) {
    return rejectWithValue(err(e, "Failed compliance"));
  }
});

export const updateTaxSettings = createAsyncThunk("pe/tax", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await httpClient.post("/payroll-enterprise/tax-config", payload);
    return data.data;
  } catch (e) {
    return rejectWithValue(err(e, "Failed tax save"));
  }
});

const slice = createSlice({
  name: "payrollEnterprise",
  initialState: {
    dashboard: null,
    runs: [],
    runDetails: null,
    loans: [],
    reimbursements: [],
    complianceFilings: [],
    bankTransfer: null,
    taxSettings: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearRunDetails: (state) => {
      state.runDetails = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchPayrollDashboard.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchPayrollDashboard.fulfilled, (s, a) => {
        s.loading = false;
        s.dashboard = a.payload;
      })
      .addCase(fetchPayrollDashboard.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchPayrollRuns.fulfilled, (s, a) => {
        s.runs = a.payload;
      })
      .addCase(fetchPayrollRunDetails.fulfilled, (s, a) => {
        s.runDetails = a.payload;
      })
      .addCase(fetchLoans.fulfilled, (s, a) => {
        s.loans = a.payload;
      })
      .addCase(fetchReimbursements.fulfilled, (s, a) => {
        s.reimbursements = a.payload;
      })
      .addCase(fetchComplianceFilings.fulfilled, (s, a) => {
        s.complianceFilings = a.payload;
      })
      .addCase(fetchTaxSettings.fulfilled, (s, a) => {
        s.taxSettings = a.payload;
      })
      .addCase(generatePayrollRun.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(generatePayrollRun.fulfilled, (s, a) => {
        s.saving = false;
        s.runs.unshift(a.payload);
      })
      .addCase(generatePayrollRun.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })
      .addCase(approvePayrollRun.fulfilled, (s, a) => {
        s.runs = replaceById(s.runs, a.payload);
        if (s.runDetails?.run?._id === a.payload?._id) s.runDetails.run = a.payload;
      })
      .addCase(lockPayrollRun.fulfilled, (s, a) => {
        s.runs = replaceById(s.runs, a.payload);
        if (s.runDetails?.run?._id === a.payload?._id) s.runDetails.run = a.payload;
      })
      .addCase(markPayrollPaid.fulfilled, (s, a) => {
        s.runs = replaceById(s.runs, a.payload);
        if (s.runDetails?.run?._id === a.payload?._id) s.runDetails.run = a.payload;
      })
      .addCase(rollbackPayrollRun.fulfilled, (s, a) => {
        s.runs = replaceById(s.runs, a.payload);
        if (s.runDetails?.run?._id === a.payload?._id) s.runDetails.run = a.payload;
      })
      .addCase(generateBankTransfer.fulfilled, (s, a) => {
        s.bankTransfer = a.payload;
      })
      .addCase(createLoanRequest.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createLoanRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.loans.unshift(a.payload);
      })
      .addCase(createLoanRequest.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      })
      .addCase(approveLoanRequest.fulfilled, (s, a) => {
        s.loans = replaceById(s.loans, a.payload);
      })
      .addCase(rejectLoanRequest.fulfilled, (s, a) => {
        s.loans = replaceById(s.loans, a.payload);
      })
      .addCase(updateTaxSettings.pending, (s) => {
        s.saving = true;
      })
      .addCase(updateTaxSettings.fulfilled, (s, a) => {
        s.saving = false;
        s.taxSettings = a.payload;
      })
      .addCase(updateTaxSettings.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      });
  },
});

export const { clearRunDetails } = slice.actions;
export default slice.reducer;

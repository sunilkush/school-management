import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const apiError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
const withYear = (params = {}, state) => {
  const academicYearId =
    state.academicYear?.selectedAcademicYear?._id ||
    state.academicYear?.activeYear?._id;
  return { ...params, ...(academicYearId ? { academicYearId } : {}) };
};
const getList = (payload) =>
  Array.isArray(payload) ? payload : payload?.data || [];

const makeListThunk = (type, url) =>
  createAsyncThunk(type, async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { data } = await httpClient.get(url, {
        params: withYear(params, getState()),
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to load payroll data"));
    }
  });
const makePostThunk = (type, url) =>
  createAsyncThunk(
    type,
    async (payload = {}, { getState, rejectWithValue }) => {
      try {
        const endpoint = typeof url === "function" ? url(payload) : url;
        const body = payload.body || payload;
        const { data } = await httpClient.post(
          endpoint,
          withYear(body, getState()),
        );
        return data.data;
      } catch (error) {
        return rejectWithValue(apiError(error, "Unable to save payroll data"));
      }
    },
  );

export const fetchPayrollComponents = makeListThunk(
  "payrollModule/components/list",
  "/payroll/components",
);
export const createPayrollComponent = makePostThunk(
  "payrollModule/components/create",
  "/payroll/components",
);
export const updatePayrollComponent = createAsyncThunk(
  "payrollModule/components/update",
  async ({ id, body }, { getState, rejectWithValue }) => {
    try {
      const { data } = await httpClient.put(
        `/payroll/components/${id}`,
        withYear(body, getState()),
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to update component"));
    }
  },
);
export const deletePayrollComponent = createAsyncThunk(
  "payrollModule/components/delete",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await httpClient.delete(`/payroll/components/${id}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to delete component"));
    }
  },
);

export const fetchSalaryTemplates = makeListThunk(
  "payrollModule/templates/list",
  "/payroll/templates",
);
export const createSalaryTemplate = makePostThunk(
  "payrollModule/templates/create",
  "/payroll/templates",
);
export const updateSalaryTemplate = createAsyncThunk(
  "payrollModule/templates/update",
  async ({ id, body }, { getState, rejectWithValue }) => {
    try {
      const { data } = await httpClient.put(
        `/payroll/templates/${id}`,
        withYear(body, getState()),
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to update template"));
    }
  },
);
export const deleteSalaryTemplate = createAsyncThunk(
  "payrollModule/templates/delete",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await httpClient.delete(`/payroll/templates/${id}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to delete template"));
    }
  },
);

export const fetchSalaryStructures = makeListThunk(
  "payrollModule/structures/list",
  "/payroll/salary-structures",
);
export const createSalaryStructure = makePostThunk(
  "payrollModule/structures/create",
  "/payroll/salary-structures",
);
export const fetchPayrollCycles = makeListThunk(
  "payrollModule/cycles/list",
  "/payroll/cycles",
);
export const createPayrollCycle = makePostThunk(
  "payrollModule/cycles/create",
  "/payroll/cycles",
);
export const fetchPayrollCycleDetail = createAsyncThunk(
  "payrollModule/cycles/detail",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { data } = await httpClient.get(`/payroll/cycles/${id}`, {
        params: withYear({}, getState()),
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to load cycle detail"));
    }
  },
);
export const runPayrollCycle = makePostThunk(
  "payrollModule/cycles/run",
  ({ id }) => `/payroll/cycles/${id}/run`,
);
export const recalculatePayrollCycle = makePostThunk(
  "payrollModule/cycles/recalculate",
  ({ id }) => `/payroll/cycles/${id}/recalculate`,
);
export const submitPayrollCycle = makePostThunk(
  "payrollModule/cycles/submit",
  ({ id }) => `/payroll/cycles/${id}/submit`,
);
export const approvePayrollCycle = makePostThunk(
  "payrollModule/cycles/approve",
  ({ id }) => `/payroll/cycles/${id}/approve`,
);
export const rejectPayrollCycle = makePostThunk(
  "payrollModule/cycles/reject",
  ({ id }) => `/payroll/cycles/${id}/reject`,
);
export const lockPayrollCycle = makePostThunk(
  "payrollModule/cycles/lock",
  ({ id }) => `/payroll/cycles/${id}/lock`,
);

export const fetchPayslips = makeListThunk(
  "payrollModule/payslips/list",
  "/payroll/payslips",
);
export const fetchMyPayslips = makeListThunk(
  "payrollModule/payslips/my",
  "/payroll/my-payslips",
);
export const bulkMarkSalaryPaid = makePostThunk(
  "payrollModule/payments/bulkPaid",
  "/payroll/payments/bulk-mark-paid",
);
export const fetchLoans = makeListThunk(
  "payrollModule/loans/list",
  "/payroll/loans",
);
export const createLoan = makePostThunk(
  "payrollModule/loans/create",
  "/payroll/loans",
);
export const approveLoan = makePostThunk(
  "payrollModule/loans/approve",
  ({ id }) => `/payroll/loans/${id}/approve`,
);
export const rejectLoan = makePostThunk(
  "payrollModule/loans/reject",
  ({ id }) => `/payroll/loans/${id}/reject`,
);
export const fetchPayrollSummary = makeListThunk(
  "payrollModule/reports/summary",
  "/payroll/reports/summary",
);
export const fetchEmployeeReport = makeListThunk(
  "payrollModule/reports/employee",
  "/payroll/reports/employee",
);
export const fetchStatutoryReport = makeListThunk(
  "payrollModule/reports/statutory",
  "/payroll/reports/statutory",
);
export const fetchLoanReport = makeListThunk(
  "payrollModule/reports/loans",
  "/payroll/reports/loans",
);
export const fetchMyPayroll = makeListThunk(
  "payrollModule/myPayroll",
  "/payroll/my-payroll",
);

const initialState = {
  components: [],
  templates: [],
  structures: [],
  cycles: [],
  cycleDetail: null,
  payslips: [],
  myPayslips: [],
  loans: [],
  reports: { summary: null, employee: [], statutory: null, loans: null },
  myPayroll: null,
  loading: false,
  saving: false,
  error: null,
};

const upsert = (list, item) =>
  list.some((row) => row._id === item?._id)
    ? list.map((row) => (row._id === item._id ? item : row))
    : [item, ...list];

const payrollModuleSlice = createSlice({
  name: "payrollModule",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCycleDetail: (state) => {
      state.cycleDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (a) =>
          a.type.startsWith("payrollModule/") && a.type.endsWith("/pending"),
        (state, action) => {
          state.error = null;
          if (
            action.type.includes("create") ||
            action.type.includes("update") ||
            action.type.includes("delete") ||
            action.type.includes("run") ||
            action.type.includes("approve") ||
            action.type.includes("reject") ||
            action.type.includes("lock") ||
            action.type.includes("submit")
          )
            state.saving = true;
          else state.loading = true;
        },
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("payrollModule/") && a.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.saving = false;
          state.error = action.payload;
        },
      )
      .addMatcher(
        (a) =>
          a.type.startsWith("payrollModule/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
          state.saving = false;
        },
      );

    builder
      .addCase(fetchPayrollComponents.fulfilled, (s, a) => {
        s.components = getList(a.payload);
      })
      .addCase(createPayrollComponent.fulfilled, (s, a) => {
        s.components = upsert(s.components, a.payload);
      })
      .addCase(updatePayrollComponent.fulfilled, (s, a) => {
        s.components = upsert(s.components, a.payload);
      })
      .addCase(deletePayrollComponent.fulfilled, (s, a) => {
        s.components = upsert(s.components, a.payload);
      })
      .addCase(fetchSalaryTemplates.fulfilled, (s, a) => {
        s.templates = getList(a.payload);
      })
      .addCase(createSalaryTemplate.fulfilled, (s, a) => {
        s.templates = upsert(s.templates, a.payload);
      })
      .addCase(updateSalaryTemplate.fulfilled, (s, a) => {
        s.templates = upsert(s.templates, a.payload);
      })
      .addCase(deleteSalaryTemplate.fulfilled, (s, a) => {
        s.templates = upsert(s.templates, a.payload);
      })
      .addCase(fetchSalaryStructures.fulfilled, (s, a) => {
        s.structures = getList(a.payload);
      })
      .addCase(createSalaryStructure.fulfilled, (s, a) => {
        s.structures = upsert(s.structures, a.payload);
      })
      .addCase(fetchPayrollCycles.fulfilled, (s, a) => {
        s.cycles = getList(a.payload);
      })
      .addCase(createPayrollCycle.fulfilled, (s, a) => {
        s.cycles = upsert(s.cycles, a.payload);
      })
      .addCase(fetchPayrollCycleDetail.fulfilled, (s, a) => {
        s.cycleDetail = a.payload;
      })
      .addCase(runPayrollCycle.fulfilled, (s, a) => {
        s.cycleDetail = a.payload;
        s.cycles = upsert(s.cycles, a.payload?.cycle);
      })
      .addCase(recalculatePayrollCycle.fulfilled, (s, a) => {
        s.cycleDetail = a.payload;
        s.cycles = upsert(s.cycles, a.payload?.cycle);
      })
      .addCase(submitPayrollCycle.fulfilled, (s, a) => {
        s.cycles = upsert(s.cycles, a.payload);
      })
      .addCase(approvePayrollCycle.fulfilled, (s, a) => {
        s.cycles = upsert(s.cycles, a.payload);
      })
      .addCase(rejectPayrollCycle.fulfilled, (s, a) => {
        s.cycles = upsert(s.cycles, a.payload);
      })
      .addCase(lockPayrollCycle.fulfilled, (s, a) => {
        s.cycles = upsert(s.cycles, a.payload);
      })
      .addCase(fetchPayslips.fulfilled, (s, a) => {
        s.payslips = getList(a.payload);
      })
      .addCase(fetchMyPayslips.fulfilled, (s, a) => {
        s.myPayslips = getList(a.payload);
      })
      .addCase(fetchLoans.fulfilled, (s, a) => {
        s.loans = getList(a.payload);
      })
      .addCase(createLoan.fulfilled, (s, a) => {
        s.loans = upsert(s.loans, a.payload);
      })
      .addCase(approveLoan.fulfilled, (s, a) => {
        s.loans = upsert(s.loans, a.payload);
      })
      .addCase(rejectLoan.fulfilled, (s, a) => {
        s.loans = upsert(s.loans, a.payload);
      })
      .addCase(fetchPayrollSummary.fulfilled, (s, a) => {
        s.reports.summary = a.payload;
      })
      .addCase(fetchEmployeeReport.fulfilled, (s, a) => {
        s.reports.employee = getList(a.payload);
      })
      .addCase(fetchStatutoryReport.fulfilled, (s, a) => {
        s.reports.statutory = a.payload;
      })
      .addCase(fetchLoanReport.fulfilled, (s, a) => {
        s.reports.loans = a.payload;
      })
      .addCase(fetchMyPayroll.fulfilled, (s, a) => {
        s.myPayroll = a.payload;
      });
  },
});

export const { clearError, clearCycleDetail } = payrollModuleSlice.actions;
export default payrollModuleSlice.reducer;

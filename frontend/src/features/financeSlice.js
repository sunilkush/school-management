import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// ── Accountant Dashboard ──────────────────────────────────────────────────────
export const fetchAccountantDashboard = createAsyncThunk(
  "finance/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/dashboard/accountant/financial");
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch financial dashboard"));
    }
  }
);

// ── Income ────────────────────────────────────────────────────────────────────
export const fetchIncome = createAsyncThunk(
  "finance/fetchIncome",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/income", { params });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch income"));
    }
  }
);

export const fetchIncomeSummary = createAsyncThunk(
  "finance/fetchIncomeSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/income/summary", { params });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch income summary"));
    }
  }
);

export const createIncome = createAsyncThunk(
  "finance/createIncome",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/income", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to create income record"));
    }
  }
);

export const updateIncome = createAsyncThunk(
  "finance/updateIncome",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/income/${id}`, payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to update income record"));
    }
  }
);

export const deleteIncome = createAsyncThunk(
  "finance/deleteIncome",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/income/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to delete income record"));
    }
  }
);

// ── Expenses ──────────────────────────────────────────────────────────────────
export const fetchExpenses = createAsyncThunk(
  "finance/fetchExpenses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/expenses", { params });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch expenses"));
    }
  }
);

export const fetchExpenseSummary = createAsyncThunk(
  "finance/fetchExpenseSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/expenses/summary", { params });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch expense summary"));
    }
  }
);

export const createExpense = createAsyncThunk(
  "finance/createExpense",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/expenses", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to create expense record"));
    }
  }
);

export const updateExpense = createAsyncThunk(
  "finance/updateExpense",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/expenses/${id}`, payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to update expense record"));
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "finance/deleteExpense",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/expenses/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to delete expense record"));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const initialState = {
  // Dashboard
  dashboard:        null,
  dashboardLoading: false,

  // Income
  incomeRecords:    [],
  incomeTotal:      0,
  incomeTotalAmount: 0,
  incomeSummary:    null,
  incomeLoading:    false,
  incomeSumLoading: false,

  // Expenses
  expenseRecords:    [],
  expenseTotal:      0,
  expenseTotalAmount: 0,
  expenseSummary:    null,
  expenseLoading:    false,
  expenseSumLoading: false,

  // Action
  actionLoading: false,
  error:         null,
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearFinanceError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchAccountantDashboard.pending,    (s) => { s.dashboardLoading = true; s.error = null; })
      .addCase(fetchAccountantDashboard.fulfilled,  (s, a) => { s.dashboardLoading = false; s.dashboard = a.payload; })
      .addCase(fetchAccountantDashboard.rejected,   (s, a) => { s.dashboardLoading = false; s.error = a.payload; })

      // Income list
      .addCase(fetchIncome.pending,    (s) => { s.incomeLoading = true; s.error = null; })
      .addCase(fetchIncome.fulfilled,  (s, a) => {
        s.incomeLoading = false;
        s.incomeRecords     = a.payload?.records    || [];
        s.incomeTotal       = a.payload?.total       || 0;
        s.incomeTotalAmount = a.payload?.totalAmount || 0;
      })
      .addCase(fetchIncome.rejected,   (s, a) => { s.incomeLoading = false; s.error = a.payload; })

      // Income summary
      .addCase(fetchIncomeSummary.pending,    (s) => { s.incomeSumLoading = true; })
      .addCase(fetchIncomeSummary.fulfilled,  (s, a) => { s.incomeSumLoading = false; s.incomeSummary = a.payload; })
      .addCase(fetchIncomeSummary.rejected,   (s, a) => { s.incomeSumLoading = false; s.error = a.payload; })

      // Expense list
      .addCase(fetchExpenses.pending,    (s) => { s.expenseLoading = true; s.error = null; })
      .addCase(fetchExpenses.fulfilled,  (s, a) => {
        s.expenseLoading = false;
        s.expenseRecords     = a.payload?.records    || [];
        s.expenseTotal       = a.payload?.total       || 0;
        s.expenseTotalAmount = a.payload?.totalAmount || 0;
      })
      .addCase(fetchExpenses.rejected,   (s, a) => { s.expenseLoading = false; s.error = a.payload; })

      // Expense summary
      .addCase(fetchExpenseSummary.pending,    (s) => { s.expenseSumLoading = true; })
      .addCase(fetchExpenseSummary.fulfilled,  (s, a) => { s.expenseSumLoading = false; s.expenseSummary = a.payload; })
      .addCase(fetchExpenseSummary.rejected,   (s, a) => { s.expenseSumLoading = false; s.error = a.payload; })

      // Mutations (create / update / delete)
      .addMatcher(
        (a) => ["finance/createIncome", "finance/updateIncome", "finance/deleteIncome",
                 "finance/createExpense", "finance/updateExpense", "finance/deleteExpense"]
          .some((p) => a.type.startsWith(p) && a.type.endsWith("/pending")),
        (s) => { s.actionLoading = true; s.error = null; }
      )
      .addMatcher(
        (a) => ["finance/createIncome", "finance/updateIncome", "finance/deleteIncome",
                 "finance/createExpense", "finance/updateExpense", "finance/deleteExpense"]
          .some((p) => a.type.startsWith(p) && (a.type.endsWith("/fulfilled") || a.type.endsWith("/rejected"))),
        (s, a) => {
          s.actionLoading = false;
          if (a.type.endsWith("/rejected")) s.error = a.payload;
        }
      );
  },
});

export const { clearFinanceError } = financeSlice.actions;
export default financeSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Double-entry ledger: chart of accounts, journal, the statements built from them, and the
 * reconciliation sweep that turns already-recorded money events into journal entries.
 *
 * Statements are kept in separate slots rather than one `report` field — an accountant flips
 * between trial balance, P&L and balance sheet constantly, and sharing one slot would blank the
 * screen on every switch and re-fetch what was already loaded.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`ledger/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

/* ── Chart of accounts ───────────────────────────────────────────── */

export const fetchAccounts = thunk(
  "fetchAccounts",
  (params = {}) => apiClient.get("/ledger/accounts", { params }),
  "Failed to load the chart of accounts"
);

export const seedAccounts = thunk(
  "seedAccounts",
  () => apiClient.post("/ledger/accounts/seed", {}),
  "Failed to set up the chart of accounts"
);

export const createAccount = thunk(
  "createAccount",
  (payload) => apiClient.post("/ledger/accounts", payload),
  "Failed to create the account"
);

export const updateAccount = thunk(
  "updateAccount",
  ({ id, payload }) => apiClient.put(`/ledger/accounts/${id}`, payload),
  "Failed to update the account"
);

export const deleteAccount = createAsyncThunk(
  "ledger/deleteAccount",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/ledger/accounts/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to delete the account"));
    }
  }
);

export const fetchAccountLedger = thunk(
  "fetchAccountLedger",
  ({ id, ...params }) => apiClient.get(`/ledger/accounts/${id}/ledger`, { params }),
  "Failed to load the account ledger"
);

/* ── Journal ─────────────────────────────────────────────────────── */

export const fetchEntries = thunk(
  "fetchEntries",
  (params = {}) => apiClient.get("/ledger/entries", { params }),
  "Failed to load journal entries"
);

export const createEntry = thunk(
  "createEntry",
  (payload) => apiClient.post("/ledger/entries", payload),
  "Failed to save the entry"
);

export const postEntry = thunk(
  "postEntry",
  (id) => apiClient.patch(`/ledger/entries/${id}/post`),
  "Failed to post the entry"
);

export const reverseEntry = thunk(
  "reverseEntry",
  ({ id, ...payload }) => apiClient.post(`/ledger/entries/${id}/reverse`, payload),
  "Failed to reverse the entry"
);

/* ── Statements ──────────────────────────────────────────────────── */

export const fetchTrialBalance = thunk(
  "fetchTrialBalance",
  (params = {}) => apiClient.get("/ledger/reports/trial-balance", { params }),
  "Failed to load the trial balance"
);

export const fetchProfitAndLoss = thunk(
  "fetchProfitAndLoss",
  (params = {}) => apiClient.get("/ledger/reports/profit-and-loss", { params }),
  "Failed to load income & expenditure"
);

export const fetchBalanceSheet = thunk(
  "fetchBalanceSheet",
  (params = {}) => apiClient.get("/ledger/reports/balance-sheet", { params }),
  "Failed to load the balance sheet"
);

/* ── Reconciliation ──────────────────────────────────────────────── */

export const fetchReconciliation = thunk(
  "fetchReconciliation",
  (params = {}) => apiClient.get("/ledger/reports/reconciliation", { params }),
  "Failed to load the reconciliation report"
);

export const runPostPending = thunk(
  "runPostPending",
  (payload = {}) => apiClient.post("/ledger/post-pending", payload),
  "Failed to post the pending entries"
);

const initialState = {
  accounts: [],
  accountsLoading: false,
  entries: [],
  entriesLoading: false,
  accountLedger: null,
  accountLedgerLoading: false,
  trialBalance: null,
  profitAndLoss: null,
  balanceSheet: null,
  statementLoading: false,
  reconciliation: null,
  reconciliationLoading: false,
  actionLoading: false,
  error: null,
};

const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {
    clearLedgerError: (state) => { state.error = null; },
    clearAccountLedger: (state) => { state.accountLedger = null; },
  },
  extraReducers: (builder) => {
    const loadInto = (thunkRef, listKey, loadingKey) => {
      builder
        .addCase(thunkRef.pending, (state) => { state[loadingKey] = true; state.error = null; })
        .addCase(thunkRef.fulfilled, (state, action) => {
          state[loadingKey] = false;
          state[listKey] = action.payload ?? initialState[listKey];
        })
        .addCase(thunkRef.rejected, (state, action) => {
          state[loadingKey] = false;
          state.error = action.payload;
        });
    };

    loadInto(fetchAccounts, "accounts", "accountsLoading");
    loadInto(fetchEntries, "entries", "entriesLoading");
    loadInto(fetchAccountLedger, "accountLedger", "accountLedgerLoading");
    loadInto(fetchTrialBalance, "trialBalance", "statementLoading");
    loadInto(fetchProfitAndLoss, "profitAndLoss", "statementLoading");
    loadInto(fetchBalanceSheet, "balanceSheet", "statementLoading");
    loadInto(fetchReconciliation, "reconciliation", "reconciliationLoading");

    // Writes share one flag — the UI disables the whole toolbar while any of them is in flight,
    // so a double-click cannot post the same entry twice.
    const writes = [seedAccounts, createAccount, updateAccount, createEntry, postEntry, reverseEntry, runPostPending];
    writes.forEach((t) => {
      builder
        .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
        .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
        .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
    });

    // Handled on its own (not in the loop above) because RTK rejects two reducers for the same
    // action type, and this one also drops the row from the list.
    builder
      .addCase(deleteAccount.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.accounts = state.accounts.filter((a) => a._id !== action.payload);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLedgerError, clearAccountLedger } = ledgerSlice.actions;
export default ledgerSlice.reducer;

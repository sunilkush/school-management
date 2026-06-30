import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const err = (e, fb) => e?.response?.data?.message || e?.message || fb;

export const fetchStockIssues = createAsyncThunk("stockIssue/fetch", async (params = {}, { rejectWithValue }) => {
  try { const r = await apiClient.get("/stock-issues", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to fetch issues")); }
});

export const createStockIssue = createAsyncThunk("stockIssue/create", async (data, { rejectWithValue }) => {
  try { const r = await apiClient.post("/stock-issues", data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to create issue")); }
});

export const processReturn = createAsyncThunk("stockIssue/return", async ({ id, ...data }, { rejectWithValue }) => {
  try { const r = await apiClient.patch(`/stock-issues/${id}/return`, data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to process return")); }
});

export const deleteStockIssue = createAsyncThunk("stockIssue/delete", async (id, { rejectWithValue }) => {
  try { await apiClient.delete(`/stock-issues/${id}`); return id; }
  catch (e) { return rejectWithValue(err(e, "Failed to delete issue")); }
});

const stockIssueSlice = createSlice({
  name: "stockIssue",
  initialState: { issues: [], loading: false, actionLoading: false, error: null },
  reducers: { clearStockIssueError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchStockIssues.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchStockIssues.fulfilled, (s, a) => { s.loading = false; s.issues = a.payload; })
      .addCase(fetchStockIssues.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createStockIssue.fulfilled, (s, a) => { s.issues.unshift(a.payload); s.actionLoading = false; })
      .addCase(processReturn.fulfilled,    (s, a) => { const i = s.issues.findIndex(x => x._id === a.payload?._id); if (i !== -1) s.issues[i] = a.payload; s.actionLoading = false; })
      .addCase(deleteStockIssue.fulfilled, (s, a) => { s.issues = s.issues.filter(x => x._id !== a.payload); s.actionLoading = false; })
      .addMatcher((a) => a.type.startsWith("stockIssue/") && a.type.endsWith("/pending") && a.type !== "stockIssue/fetch/pending",   (s) => { s.actionLoading = true; s.error = null; })
      .addMatcher((a) => a.type.startsWith("stockIssue/") && a.type.endsWith("/rejected") && a.type !== "stockIssue/fetch/rejected", (s, a) => { s.actionLoading = false; s.error = a.payload; });
  },
});
export const { clearStockIssueError } = stockIssueSlice.actions;
export default stockIssueSlice.reducer;

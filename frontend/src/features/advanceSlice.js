import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const err = (e, fb) => e?.response?.data?.message || fb;

/* ── ADVANCE ── */
export const fetchAdvances = createAsyncThunk("advance/fetchAll", async (params = {}, { rejectWithValue }) => {
  try { const r = await httpClient.get("/advance", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to load advances")); }
});
export const createAdvance = createAsyncThunk("advance/create", async (payload, { rejectWithValue }) => {
  try { const r = await httpClient.post("/advance", payload); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to create advance")); }
});
export const approveAdvance = createAsyncThunk("advance/approve", async ({ id, note }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/advance/${id}/approve`, { note }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to approve advance")); }
});
export const rejectAdvance = createAsyncThunk("advance/reject", async ({ id, reason }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/advance/${id}/reject`, { reason }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to reject advance")); }
});
export const deductEmi = createAsyncThunk("advance/deductEmi", async ({ id, note }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/advance/${id}/deduct-emi`, { note }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to deduct EMI")); }
});
export const closeAdvance = createAsyncThunk("advance/close", async ({ id, note }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/advance/${id}/close`, { note }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to close advance")); }
});

/* ── BONUS ── */
export const fetchBonuses = createAsyncThunk("advance/fetchBonuses", async (params = {}, { rejectWithValue }) => {
  try { const r = await httpClient.get("/bonus", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to load bonuses")); }
});
export const createBonus = createAsyncThunk("advance/createBonus", async (payload, { rejectWithValue }) => {
  try { const r = await httpClient.post("/bonus", payload); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to create bonus")); }
});
export const updateBonus = createAsyncThunk("advance/updateBonus", async ({ id, payload }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/bonus/${id}`, payload); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to update bonus")); }
});
export const deleteBonus = createAsyncThunk("advance/deleteBonus", async (id, { rejectWithValue }) => {
  try { await httpClient.delete(`/bonus/${id}`); return id; }
  catch (e) { return rejectWithValue(err(e, "Failed to delete bonus")); }
});
export const approveBonus = createAsyncThunk("advance/approveBonus", async (id, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/bonus/${id}/approve`); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to approve bonus")); }
});
export const cancelBonus = createAsyncThunk("advance/cancelBonus", async (id, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/bonus/${id}/cancel`); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to cancel bonus")); }
});

/* ── REIMBURSEMENT ── */
export const fetchReimbursements = createAsyncThunk("advance/fetchReimb", async (params = {}, { rejectWithValue }) => {
  try { const r = await httpClient.get("/reimbursements", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to load reimbursements")); }
});
export const createReimbursement = createAsyncThunk("advance/createReimb", async (payload, { rejectWithValue }) => {
  try { const r = await httpClient.post("/reimbursements", payload); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to submit claim")); }
});
export const managerApproveReimb = createAsyncThunk("advance/managerApprove", async ({ id, remark }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/reimbursements/${id}/manager-approve`, { remark }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to approve")); }
});
export const financeApproveReimb = createAsyncThunk("advance/financeApprove", async ({ id, remark }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/reimbursements/${id}/finance-approve`, { remark }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to approve")); }
});
export const rejectReimb = createAsyncThunk("advance/rejectReimb", async ({ id, reason }, { rejectWithValue }) => {
  try { const r = await httpClient.put(`/reimbursements/${id}/reject`, { reason }); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to reject")); }
});
export const deleteReimb = createAsyncThunk("advance/deleteReimb", async (id, { rejectWithValue }) => {
  try { await httpClient.delete(`/reimbursements/${id}`); return id; }
  catch (e) { return rejectWithValue(err(e, "Failed to delete")); }
});

const advanceSlice = createSlice({
  name: "advance",
  initialState: {
    advances: [],
    bonuses: [],
    reimbursements: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, a) => { state.loading = false; state.error = a.payload; };

    builder
      .addCase(fetchAdvances.pending, pending)
      .addCase(fetchAdvances.fulfilled, (state, a) => { state.loading = false; state.advances = a.payload; })
      .addCase(fetchAdvances.rejected, rejected)

      .addCase(fetchBonuses.pending, pending)
      .addCase(fetchBonuses.fulfilled, (state, a) => { state.loading = false; state.bonuses = a.payload; })
      .addCase(fetchBonuses.rejected, rejected)

      .addCase(fetchReimbursements.pending, pending)
      .addCase(fetchReimbursements.fulfilled, (state, a) => { state.loading = false; state.reimbursements = a.payload; })
      .addCase(fetchReimbursements.rejected, rejected)

      // For create/update/delete — just set loading state; caller re-fetches
      .addMatcher(
        (action) => action.type.startsWith("advance/") && action.type.endsWith("/pending") && !["advance/fetchAll", "advance/fetchBonuses", "advance/fetchReimb"].some(p => action.type.startsWith(p)),
        (state) => { state.loading = true; state.error = null; }
      )
      .addMatcher(
        (action) => action.type.startsWith("advance/") && (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")) && !["advance/fetchAll", "advance/fetchBonuses", "advance/fetchReimb"].some(p => action.type.startsWith(p)),
        (state, a) => {
          state.loading = false;
          if (a.type.endsWith("/rejected")) state.error = a.payload;
        }
      );
  },
});

export default advanceSlice.reducer;

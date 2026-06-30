import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const err = (e, fb) => e?.response?.data?.message || e?.message || fb;

export const fetchAMCs = createAsyncThunk("amc/fetch", async (params = {}, { rejectWithValue }) => {
  try { const r = await apiClient.get("/amc", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to fetch AMCs")); }
});

export const createAMC = createAsyncThunk("amc/create", async (data, { rejectWithValue }) => {
  try { const r = await apiClient.post("/amc", data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to create AMC")); }
});

export const updateAMC = createAsyncThunk("amc/update", async ({ id, ...data }, { rejectWithValue }) => {
  try { const r = await apiClient.put(`/amc/${id}`, data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to update AMC")); }
});

export const addServiceLog = createAsyncThunk("amc/serviceLog", async ({ id, ...data }, { rejectWithValue }) => {
  try { const r = await apiClient.post(`/amc/${id}/service-log`, data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to add service log")); }
});

export const deleteAMC = createAsyncThunk("amc/delete", async (id, { rejectWithValue }) => {
  try { await apiClient.delete(`/amc/${id}`); return id; }
  catch (e) { return rejectWithValue(err(e, "Failed to delete AMC")); }
});

const amcSlice = createSlice({
  name: "amc",
  initialState: { amcs: [], loading: false, actionLoading: false, error: null },
  reducers: { clearAmcError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchAMCs.pending,      (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAMCs.fulfilled,    (s, a) => { s.loading = false; s.amcs = a.payload; })
      .addCase(fetchAMCs.rejected,     (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createAMC.fulfilled,    (s, a) => { s.amcs.unshift(a.payload); s.actionLoading = false; })
      .addCase(updateAMC.fulfilled,    (s, a) => { const i = s.amcs.findIndex(x => x._id === a.payload?._id); if (i !== -1) s.amcs[i] = a.payload; s.actionLoading = false; })
      .addCase(addServiceLog.fulfilled,(s, a) => { const i = s.amcs.findIndex(x => x._id === a.payload?._id); if (i !== -1) s.amcs[i] = a.payload; s.actionLoading = false; })
      .addCase(deleteAMC.fulfilled,    (s, a) => { s.amcs = s.amcs.filter(x => x._id !== a.payload); s.actionLoading = false; })
      .addMatcher((a) => a.type.startsWith("amc/") && a.type.endsWith("/pending") && a.type !== "amc/fetch/pending",   (s) => { s.actionLoading = true; s.error = null; })
      .addMatcher((a) => a.type.startsWith("amc/") && a.type.endsWith("/rejected") && a.type !== "amc/fetch/rejected", (s, a) => { s.actionLoading = false; s.error = a.payload; });
  },
});
export const { clearAmcError } = amcSlice.actions;
export default amcSlice.reducer;

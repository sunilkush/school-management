import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Scholarships and fee concessions — the named schemes, who holds them, and what it all costs.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`scholarship/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchSchemes = thunk("fetchSchemes", (params = {}) => apiClient.get("/scholarships/schemes", { params }), "Failed to load the schemes");
export const createScheme = thunk("createScheme", (payload) => apiClient.post("/scholarships/schemes", payload), "Failed to create the scheme");
export const updateScheme = thunk("updateScheme", ({ id, ...payload }) => apiClient.patch(`/scholarships/schemes/${id}`, payload), "Failed to update the scheme");
export const deleteScheme = thunk("deleteScheme", (id) => apiClient.delete(`/scholarships/schemes/${id}`), "Failed to delete the scheme");

export const fetchAwards = thunk("fetchAwards", (params = {}) => apiClient.get("/scholarships/awards", { params }), "Failed to load the concessions");
export const requestAward = thunk("requestAward", (payload) => apiClient.post("/scholarships/awards", payload), "Failed to record the concession");
export const decideAward = thunk("decideAward", ({ id, decision, note }) => apiClient.patch(`/scholarships/awards/${id}/decide`, { decision, note }), "Failed to record the decision");
export const revokeAward = thunk("revokeAward", ({ id, note }) => apiClient.patch(`/scholarships/awards/${id}/revoke`, { note }), "Failed to revoke");

export const fetchReport = thunk("fetchReport", (params = {}) => apiClient.get("/scholarships/report", { params }), "Failed to load the report");
export const fetchMismatches = thunk("fetchMismatches", (params = {}) => apiClient.get("/scholarships/mismatches", { params }), "Failed to load the mismatches");
export const syncConcessions = thunk("sync", (payload = {}) => apiClient.post("/scholarships/sync", payload), "Failed to apply the concessions");
export const recordAmounts = thunk("recordAmounts", (payload = {}) => apiClient.post("/scholarships/record-amounts", payload), "Failed to cost the concessions");

const initialState = {
  schemes: [],
  schemesLoading: false,
  awards: [],
  awardsLoading: false,
  report: null,
  reportLoading: false,
  mismatches: [],
  actionLoading: false,
  error: null,
};

const scholarshipSlice = createSlice({
  name: "scholarship",
  initialState,
  extraReducers: (builder) => {
    const loadInto = (t, key, loadingKey) => {
      builder
        .addCase(t.pending, (state) => { if (loadingKey) state[loadingKey] = true; state.error = null; })
        .addCase(t.fulfilled, (state, action) => {
          if (loadingKey) state[loadingKey] = false;
          state[key] = action.payload ?? initialState[key];
        })
        .addCase(t.rejected, (state, action) => { if (loadingKey) state[loadingKey] = false; state.error = action.payload; });
    };

    loadInto(fetchSchemes, "schemes", "schemesLoading");
    loadInto(fetchAwards, "awards", "awardsLoading");
    loadInto(fetchReport, "report", "reportLoading");
    loadInto(fetchMismatches, "mismatches", null);

    [createScheme, updateScheme, deleteScheme, requestAward, decideAward, revokeAward, syncConcessions, recordAmounts]
      .forEach((t) => {
        builder
          .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
          .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
          .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
      });
  },
});

export default scholarshipSlice.reducer;

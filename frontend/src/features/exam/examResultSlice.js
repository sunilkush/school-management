import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const generateExamResults = createAsyncThunk("examResults/generate", async (payload, { rejectWithValue }) => {
  try { const { data } = await apiClient.post("/exam-results/generate", payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const fetchExamResults = createAsyncThunk("examResults/list", async (params = {}, { rejectWithValue }) => {
  try { const q = new URLSearchParams(params).toString(); const { data } = await apiClient.get(q ? `/exam-results?${q}` : "/exam-results"); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const publishExamResultsV2 = createAsyncThunk("examResults/publish", async (payload, { rejectWithValue }) => {
  try { const { data } = await apiClient.post("/exam-results/publish", payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const unpublishExamResults = createAsyncThunk("examResults/unpublish", async (payload, { rejectWithValue }) => {
  try { const { data } = await apiClient.post("/exam-results/unpublish", payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const fetchReportCard = createAsyncThunk("examResults/reportCard", async (params = {}, { rejectWithValue }) => {
  try {
    const { studentId, ...rest } = params;
    const query = new URLSearchParams(rest).toString();
    const endpoint = studentId ? `/exam-results/report-card/${studentId}` : "/exam-results/report-card";
    const { data } = await apiClient.get(query ? `${endpoint}?${query}` : endpoint);
    return data.data;
  }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const slice = createSlice({ name: "examResultsV2", initialState: { loading: false, error: null, success: false, list: [], reportCard: null }, reducers: {}, extraReducers: (b) => {
  [generateExamResults, fetchExamResults, publishExamResultsV2, unpublishExamResults, fetchReportCard].forEach((t) => {
    b.addCase(t.pending, (s) => { s.loading = true; s.error = null; s.success = false; });
    b.addCase(t.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  });
  b.addCase(fetchExamResults.fulfilled, (s, a) => { s.loading = false; s.success = true; s.list = a.payload || []; });
  b.addCase(generateExamResults.fulfilled, (s) => { s.loading = false; s.success = true; });
  b.addCase(publishExamResultsV2.fulfilled, (s) => { s.loading = false; s.success = true; });
  b.addCase(unpublishExamResults.fulfilled, (s) => { s.loading = false; s.success = true; });
  b.addCase(fetchReportCard.fulfilled, (s, a) => { s.loading = false; s.success = true; s.reportCard = a.payload || null; });
}});
export default slice.reducer;

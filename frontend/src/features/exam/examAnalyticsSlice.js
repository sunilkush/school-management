import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const fetchExamAnalyticsOverview = createAsyncThunk("examAnalytics/overview", async (params = {}, { rejectWithValue }) => {
  try { const q = new URLSearchParams(params).toString(); const { data } = await apiClient.get(`/exam-analytics/overview?${q}`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const fetchClassPerformance = createAsyncThunk("examAnalytics/class", async (params = {}, { rejectWithValue }) => {
  try { const q = new URLSearchParams(params).toString(); const { data } = await apiClient.get(`/exam-analytics/class-performance?${q}`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const fetchSubjectPerformance = createAsyncThunk("examAnalytics/subject", async (params = {}, { rejectWithValue }) => {
  try { const q = new URLSearchParams(params).toString(); const { data } = await apiClient.get(`/exam-analytics/subject-performance?${q}`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const fetchTopperList = createAsyncThunk("examAnalytics/toppers", async (params = {}, { rejectWithValue }) => {
  try { const q = new URLSearchParams(params).toString(); const { data } = await apiClient.get(`/exam-analytics/topper-list?${q}`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const slice = createSlice({ name: "examAnalytics", initialState: { loading: false, error: null, overview: null, classPerformance: [], subjectPerformance: [], toppers: [] }, reducers: {}, extraReducers: (b) => {
  [fetchExamAnalyticsOverview, fetchClassPerformance, fetchSubjectPerformance, fetchTopperList].forEach((t) => {
    b.addCase(t.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(t.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  });
  b.addCase(fetchExamAnalyticsOverview.fulfilled, (s, a) => { s.loading = false; s.overview = a.payload; });
  b.addCase(fetchClassPerformance.fulfilled, (s, a) => { s.loading = false; s.classPerformance = a.payload || []; });
  b.addCase(fetchSubjectPerformance.fulfilled, (s, a) => { s.loading = false; s.subjectPerformance = a.payload || []; });
  b.addCase(fetchTopperList.fulfilled, (s, a) => { s.loading = false; s.toppers = a.payload || []; });
}});
export default slice.reducer;

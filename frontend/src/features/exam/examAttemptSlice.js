import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const fetchOnlineAttempt = createAsyncThunk("examAttempt/get", async (attemptId, { rejectWithValue }) => {
  try { const { data } = await apiClient.get(`/online-exams/attempt/${attemptId}`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const saveOnlineAnswer = createAsyncThunk("examAttempt/save", async ({ attemptId, payload }, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/attempt/${attemptId}/save-answer`, payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const markQuestionReview = createAsyncThunk("examAttempt/review", async ({ attemptId, payload }, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/attempt/${attemptId}/mark-review`, payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const clearOnlineAnswer = createAsyncThunk("examAttempt/clear", async ({ attemptId, payload }, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/attempt/${attemptId}/clear-answer`, payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const submitOnlineAttempt = createAsyncThunk("examAttempt/submit", async (attemptId, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/attempt/${attemptId}/submit`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const slice = createSlice({ name: "examAttemptV2", initialState: { loading: false, error: null, detail: null, paper: null, timer: null, responses: [] }, reducers: {}, extraReducers: (b) => {
  [fetchOnlineAttempt, saveOnlineAnswer, markQuestionReview, clearOnlineAnswer, submitOnlineAttempt].forEach((t)=>{ b.addCase(t.pending,(s)=>{s.loading=true;s.error=null;}); b.addCase(t.rejected,(s,a)=>{s.loading=false;s.error=a.payload;});});
  b.addCase(fetchOnlineAttempt.fulfilled,(s,a)=>{s.loading=false;s.detail=a.payload.attempt;s.paper=a.payload.paper||null;s.timer=a.payload.timer;s.responses=a.payload.responses||[];});
  b.addCase(saveOnlineAnswer.fulfilled,(s)=>{s.loading=false;});
  b.addCase(markQuestionReview.fulfilled,(s)=>{s.loading=false;});
  b.addCase(clearOnlineAnswer.fulfilled,(s)=>{s.loading=false;});
  b.addCase(submitOnlineAttempt.fulfilled,(s)=>{s.loading=false;});
}});
export default slice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const fetchPendingEvaluations = createAsyncThunk("subjectiveEvaluation/pending", async (_, { rejectWithValue }) => {
  try { const { data } = await apiClient.get("/online-exams/evaluation/pending"); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const fetchEvaluationDetail = createAsyncThunk("subjectiveEvaluation/detail", async (attemptId, { rejectWithValue }) => {
  try { const { data } = await apiClient.get(`/online-exams/evaluation/${attemptId}`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const gradeSubjectiveAnswers = createAsyncThunk("subjectiveEvaluation/grade", async ({ attemptId, evaluations }, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/evaluation/${attemptId}/grade-subjective`, { evaluations }); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const finalizeSubjectiveEvaluation = createAsyncThunk("subjectiveEvaluation/finalize", async (attemptId, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/evaluation/${attemptId}/finalize`); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const slice = createSlice({ name: "subjectiveEvaluation", initialState: { loading: false, error: null, pending: [], detail: null, success: false }, reducers: {}, extraReducers: (b) => {
  [fetchPendingEvaluations, fetchEvaluationDetail, gradeSubjectiveAnswers, finalizeSubjectiveEvaluation].forEach((t)=>{ b.addCase(t.pending,(s)=>{s.loading=true;s.error=null;s.success=false;}); b.addCase(t.rejected,(s,a)=>{s.loading=false;s.error=a.payload;});});
  b.addCase(fetchPendingEvaluations.fulfilled,(s,a)=>{s.loading=false;s.pending=a.payload||[];});
  b.addCase(fetchEvaluationDetail.fulfilled,(s,a)=>{s.loading=false;s.detail=a.payload;});
  b.addCase(gradeSubjectiveAnswers.fulfilled,(s)=>{s.loading=false;s.success=true;});
  b.addCase(finalizeSubjectiveEvaluation.fulfilled,(s)=>{s.loading=false;s.success=true;});
}});
export default slice.reducer;

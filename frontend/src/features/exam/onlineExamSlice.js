import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const fetchAvailableOnlineExams = createAsyncThunk("onlineExam/available", async (_, { rejectWithValue }) => {
  try { const { data } = await apiClient.get("/online-exams/available"); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const startOnlineExamAttempt = createAsyncThunk("onlineExam/start", async ({ examId, payload = {} }, { rejectWithValue }) => {
  try { const { data } = await apiClient.post(`/online-exams/${examId}/start`, payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const slice = createSlice({ name: "onlineExam", initialState: { loading: false, error: null, list: [], activeAttempt: null }, reducers: {}, extraReducers: (b) => {
  [fetchAvailableOnlineExams, startOnlineExamAttempt].forEach((t)=>{ b.addCase(t.pending,(s)=>{s.loading=true;s.error=null;}); b.addCase(t.rejected,(s,a)=>{s.loading=false;s.error=a.payload;});});
  b.addCase(fetchAvailableOnlineExams.fulfilled,(s,a)=>{s.loading=false;s.list=a.payload||[];});
  b.addCase(startOnlineExamAttempt.fulfilled,(s,a)=>{s.loading=false;s.activeAttempt=a.payload;});
}});
export default slice.reducer;

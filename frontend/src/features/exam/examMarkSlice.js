import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const bulkSaveExamMarks = createAsyncThunk("examMarks/bulkSave", async (payload, { rejectWithValue }) => {
  try { const { data } = await apiClient.post("/exam-marks/bulk-save", payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const finalSubmitExamMarks = createAsyncThunk("examMarks/finalSubmit", async (payload, { rejectWithValue }) => {
  try { const { data } = await apiClient.post("/exam-marks/final-submit", payload); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});
export const fetchExamMarks = createAsyncThunk("examMarks/list", async (params = {}, { rejectWithValue }) => {
  try { const q = new URLSearchParams(params).toString(); const { data } = await apiClient.get(q ? `/exam-marks?${q}` : "/exam-marks"); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const examMarkSlice = createSlice({
  name: "examMarks",
  initialState: { loading: false, error: null, success: false, list: [] },
  reducers: { resetExamMarksState: (s) => { s.success = false; s.error = null; } },
  extraReducers: (builder) => {
    [bulkSaveExamMarks, finalSubmitExamMarks, fetchExamMarks].forEach((thunk) => {
      builder.addCase(thunk.pending, (s) => { s.loading = true; s.error = null; s.success = false; });
      builder.addCase(thunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    });
    builder.addCase(fetchExamMarks.fulfilled, (s, a) => { s.loading = false; s.list = a.payload || []; s.success = true; });
    builder.addCase(bulkSaveExamMarks.fulfilled, (s) => { s.loading = false; s.success = true; });
    builder.addCase(finalSubmitExamMarks.fulfilled, (s) => { s.loading = false; s.success = true; });
  },
});
export const { resetExamMarksState } = examMarkSlice.actions;
export default examMarkSlice.reducer;

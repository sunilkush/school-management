import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const createExam = createAsyncThunk("exams/createExam", async (payload, { rejectWithValue }) => {
  try {
    console.log(payload)
    const res = await apiClient.post(`/exams/`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getExams = createAsyncThunk("exams/getExams", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/exams?${query}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getExamById = createAsyncThunk("exams/getExamById", async (examId, { rejectWithValue }) => {
  try {
    if (!examId || examId === "undefined" || examId === "null") throw new Error("Invalid exam id");
    const res = await apiClient.get(`/exams/${examId}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getExamAnalytics = createAsyncThunk("exams/getExamAnalytics", async (examId, { rejectWithValue }) => {
  try {
    if (!examId || examId === "undefined" || examId === "null") throw new Error("Invalid exam id");
    const res = await apiClient.get(`/exams/${examId}/analytics`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateExam = createAsyncThunk("exams/updateExam", async ({ Id, id, examId, payload }, { rejectWithValue }) => {
  try {
    const resolvedExamId = Id || id || examId;
    if (!resolvedExamId || resolvedExamId === "undefined" || resolvedExamId === "null") throw new Error("Invalid exam id");
    const res = await apiClient.put(`/exams/${resolvedExamId}`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteExam = createAsyncThunk("exams/deleteExam", async (examId, { rejectWithValue }) => {
  try {
    if (!examId) throw new Error("Invalid exam id");
    const res = await apiClient.delete(`/exams/${examId}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const publishExam = createAsyncThunk("exams/publishExam", async ({ examId, status = "published" }, { rejectWithValue }) => {
  try {
    const res = await apiClient.put(`/exams/${examId}/publish`, { status });
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const enterMarksBulk = createAsyncThunk("exams/enterMarksBulk", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(`/exams/marks/bulk`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const submitFinalMarks = createAsyncThunk("exams/submitFinalMarks", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(`/exams/marks/submit`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const publishResults = createAsyncThunk("exams/publishResults", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(`/exams/results/publish`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getStudentResults = createAsyncThunk("exams/getStudentResults", async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/exams/results/student?${query}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getParentResults = createAsyncThunk("exams/getParentResults", async (params = {}, { rejectWithValue }) => {
  try {
    const { studentId, ...rest } = params || {};
    const query = new URLSearchParams(rest).toString();
    const endpoint = studentId ? `/exams/results/parent/${studentId}` : "/exams/results/parent";
    const res = await apiClient.get(query ? `${endpoint}?${query}` : endpoint);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const examSlice = createSlice({
  name: "exams",
  initialState: {
    exams: [],
    pagination: null,
    currentExam: null,
    results: [],
    classSummary: null,
    analytics: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
      state.error = null;
    },
    clearExamsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams.unshift(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getExams.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload.exams || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(getExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getExamById.fulfilled, (state, action) => {
        state.currentExam = action.payload;
      })
      .addCase(getExamAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExamAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(getExamAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        const index = state.exams.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) state.exams[index] = action.payload;
        if (state.currentExam?._id === action.payload._id) state.currentExam = action.payload;
      })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter((e) => e._id !== action.payload._id);
      })
      .addCase(publishExam.fulfilled, (state, action) => {
        const index = state.exams.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) state.exams[index] = action.payload;
      })
      .addCase(getStudentResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      .addCase(getParentResults.fulfilled, (state, action) => {
        state.results = action.payload;
      });
  },
});

export const { clearCurrentExam, clearExamsError } = examSlice.actions;

export default examSlice.reducer;

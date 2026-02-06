import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('accessToken');
// ---------------- Async Thunks ---------------- //

// --- Exam CRUD --- //
export const createExam = createAsyncThunk(
  "exams/createExam",
  async (payload, { rejectWithValue }) => {
    try {
       
      const res = await axios.post(`${API_BASE_URL}/exams/`, payload,
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getExams = createAsyncThunk(
  "exams/getExams",
  async (params = {}, { rejectWithValue }) => {
    try {
      
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`${API_BASE_URL}/exams?${query}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
     
      return res.data.data.exams;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getExamById = createAsyncThunk(
  "exams/getExamById",
  async (examId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/exams/${examId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateExam = createAsyncThunk(
  "exams/updateExam",
  async ({ examId, payload }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/exams/${examId}`, payload,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteExam = createAsyncThunk(
  "exams/deleteExam",
  async (examId, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/exams/${examId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Publish Exam --- //
export const publishExam = createAsyncThunk(
  "exams/publishExam",
  async (examId, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/exams/${examId}/publish`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Exam Attempts --- //
export const startExamAttempt = createAsyncThunk(
  "exams/startExamAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/exams/attempt/start`, payload,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const submitExamAttempt = createAsyncThunk(
  "exams/submitExamAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/exams/attempt/submit`, payload,
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const evaluateAttempt = createAsyncThunk(
  "exams/evaluateAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/exams/attempt/evaluate`, payload,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ---------------- Slice ---------------- //
const examSlice = createSlice({
  name: "exams",
  initialState: {
    exams: [],
    currentExam: null,
    currentAttempt: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
      state.error = null;
    },
    clearCurrentAttempt: (state) => {
      state.currentAttempt = null;
      state.error = null;
    },
    clearExamsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Create Exam ---
      .addCase(createExam.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams.push(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Get Exams ---
      .addCase(getExams.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(getExams.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Get Exam by ID ---
      .addCase(getExamById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload;
      })
      .addCase(getExamById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Update Exam ---
      .addCase(updateExam.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateExam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.exams.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.exams[index] = action.payload;
        if (state.currentExam?._id === action.payload._id) state.currentExam = action.payload;
      })
      .addCase(updateExam.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Delete Exam ---
      .addCase(deleteExam.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = state.exams.filter(e => e._id !== action.payload._id);
      })
      .addCase(deleteExam.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Publish Exam ---
      .addCase(publishExam.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(publishExam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.exams.findIndex(e => e._id === action.payload._id);
        if (index !== -1) state.exams[index] = action.payload;
        if (state.currentExam?._id === action.payload._id) state.currentExam = action.payload;
      })
      .addCase(publishExam.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Exam Attempts ---
      .addCase(startExamAttempt.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(startExamAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(startExamAttempt.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(submitExamAttempt.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitExamAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(submitExamAttempt.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(evaluateAttempt.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(evaluateAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
      })
      .addCase(evaluateAttempt.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearCurrentExam, clearCurrentAttempt, clearExamsError } = examSlice.actions;
export default examSlice.reducer;

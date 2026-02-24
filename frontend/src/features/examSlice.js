import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// 🔐 Dynamic auth header (IMPORTANT FIX)
const getAuthConfig = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ---------------- Async Thunks ---------------- //

// --- Create Exam --- //
export const createExam = createAsyncThunk(
  "exams/createExam",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/exams/`,
        payload,
        getAuthConfig()
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Get Exams --- //
export const getExams = createAsyncThunk(
  "exams/getExams",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(
        `${API_BASE_URL}/exams?${query}`,
        getAuthConfig()
      );
      return res.data.data.exams;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Get Exam by ID --- //
export const getExamById = createAsyncThunk(
  "exams/getExamById",
  async (examId, { rejectWithValue }) => {
    try {
      if (!examId || examId === "undefined" || examId === "null") {
        throw new Error("Invalid exam id");
      }

      const res = await axios.get(
        `${API_BASE_URL}/exams/${examId}`,
        getAuthConfig()
      );

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Update Exam --- //
export const updateExam = createAsyncThunk(
  "exams/updateExam",
  async ({ Id, payload }, { rejectWithValue }) => {
    try {
     
      if (!Id || Id === "undefined" || Id === "null") {
        throw new Error("Invalid exam id 3");
      }

      const res = await axios.put(
        `${API_BASE_URL}/exams/${Id}`,
        payload,
        getAuthConfig()
      );

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Delete Exam --- //
export const deleteExam = createAsyncThunk(
  "exams/deleteExam",
  async (examId, { rejectWithValue }) => {
    try {
      if (!examId) throw new Error("Invalid exam id");

      const res = await axios.delete(
        `${API_BASE_URL}/exams/${examId}`,
        getAuthConfig()
      );

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Publish Exam --- //
export const publishExam = createAsyncThunk(
  "exams/publishExam",
  async (examId, { rejectWithValue }) => {
    try {
      if (!examId) throw new Error("Invalid exam id");

      const res = await axios.put(
        `${API_BASE_URL}/exams/${examId}/publish`,
        {}, // ✅ empty body FIX
        getAuthConfig()
      );

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Exam Attempts --- //
export const startExamAttempt = createAsyncThunk(
  "exams/startExamAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/exams/attempt/start`,
        payload,
        getAuthConfig()
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

export const submitExamAttempt = createAsyncThunk(
  "exams/submitExamAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/exams/attempt/submit`,
        payload,
        getAuthConfig()
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

export const evaluateAttempt = createAsyncThunk(
  "exams/evaluateAttempt",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/exams/attempt/evaluate`,
        payload,
        getAuthConfig()
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
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
      // Create
      .addCase(createExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams.push(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get All
      .addCase(getExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(getExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get By ID
      .addCase(getExamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload;
      })
      .addCase(getExamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.exams.findIndex(
          (e) => e._id === action.payload._id
        );
        if (index !== -1) state.exams[index] = action.payload;
        if (state.currentExam?._id === action.payload._id)
          state.currentExam = action.payload;
      })
      .addCase(updateExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter(
          (e) => e._id !== action.payload._id
        );
      });
  },
});

export const {
  clearCurrentExam,
  clearCurrentAttempt,
  clearExamsError,
} = examSlice.actions;

export default examSlice.reducer;
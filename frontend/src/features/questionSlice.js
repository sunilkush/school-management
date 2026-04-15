import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";
import { toast } from "react-toastify"; // ✅ FIX: import toast


// ---------------- Async Thunks ---------------- //

// --- Create Question ---
export const createQuestions = createAsyncThunk(
  "questions/createQuestions",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/questions/create`, payload,{
          headers: {
            "Content-Type": "application/json",
          },
        });
      toast.success("Questions created successfully!");
      return res.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Bulk Create Questions ---
export const bulkCreateQuestions = createAsyncThunk(
  "questions/bulkCreate",
  async (questions, { rejectWithValue }) => {
    try {
      const payload = Array.isArray(questions) ? questions : questions?.questions || [];
      const res = await apiClient.post(
        `/questions/bulk`,
        { questions: payload },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Bulk questions uploaded successfully!");
      return res.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk upload failed");
      return rejectWithValue(err.response?.data);
    }
  }
);

// --- Get Questions ---
export const getQuestions = createAsyncThunk(
  "questions/getQuestions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiClient.get(
        `/questions/getQuestions?${query}`,
        {
          headers: {
          },
        }
      );

      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Get Single Question ---
export const getQuestionById = createAsyncThunk(
  "questions/getQuestionById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/questions/${id}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Update Question ---
export const updateQuestion = createAsyncThunk(
  "questions/updateQuestion",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/questions/${id}`, payload);
      toast.success("Question updated successfully!");
      return res.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Delete Question ---
export const deleteQuestion = createAsyncThunk(
  "questions/deleteQuestion",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/questions/${id}`);
      toast.success("Question deleted!");
      return res.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// --- Toggle Question Status ---
export const toggleQuestionStatus = createAsyncThunk(
  "questions/toggleQuestionStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/questions/${id}/toggle`);
      toast.success("Question status updated!");
      return res.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ---------------- Slice ---------------- //
const questionSlice = createSlice({
  name: "questions",
  initialState: {
    questions: [], // ✅ keep single source of truth
    currentQuestion: null,
    loading: false,
    error: null,
    success: false,
    pagination: null,
  },
  reducers: {
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
      state.error = null;
    },
    clearQuestionsError: (state) => {
      state.error = null;
    },
    resetQuestionState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Create Question ---
      .addCase(createQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.questions.push(action.payload);
      })
      .addCase(createQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Bulk Create ---
      .addCase(bulkCreateQuestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkCreateQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.questions = [...state.questions, ...action.payload]; // ✅ merged into same array
      })
      .addCase(bulkCreateQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Get Questions ---
      .addCase(getQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        state.pagination = action.payload.pagination;
      })
      .addCase(getQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Get Single Question ---
      .addCase(getQuestionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload;
      })
      .addCase(getQuestionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Update Question ---
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.questions[idx] = action.payload;
        if (state.currentQuestion?._id === action.payload._id) {
          state.currentQuestion = action.payload;
        }
      })

      // --- Delete Question ---
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
       const deletedId = action.payload?._id || action.meta.arg;
        state.questions = state.questions.filter((q) => q._id !== deletedId);
      })

      // --- Toggle Status ---
      .addCase(toggleQuestionStatus.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.questions[idx] = action.payload;
      });
  },
});

export const { clearCurrentQuestion, clearQuestionsError, resetQuestionState } =
  questionSlice.actions;
export default questionSlice.reducer;

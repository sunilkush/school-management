import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ---------------- Async Thunks ---------------- //

// --- Create Question ---
export const createQuestion = createAsyncThunk(
    "questions/createQuestion",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/questions`, payload);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// --- Bulk Create Questions ---
export const bulkCreateQuestions = createAsyncThunk(
    "questions/bulkCreateQuestions",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/questions/bulk`, payload);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// --- Get Questions ---
export const getQuestions = createAsyncThunk(
    "questions/getQuestions",
    async (params = {}, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params).toString();
            const res = await axios.get(`${API_BASE_URL}/questions?${query}`);
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
            const res = await axios.get(`${API_BASE_URL}/questions/${id}`);
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
            const res = await axios.put(`${API_BASE_URL}/questions/${id}`, payload);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// --- Delete Question ---
export const deleteQuestion = createAsyncThunk(
    "questions/deleteQuestion",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.delete(`${API_BASE_URL}/questions/${id}`);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// --- Toggle Question Status ---
export const toggleQuestionStatus = createAsyncThunk(
    "questions/toggleQuestionStatus",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/questions/${id}/toggle`);
            return res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// ---------------- Slice ---------------- //
const questionSlice = createSlice({
    name: "questions",
    initialState: {
        questions: [],
        currentQuestion: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentQuestion: (state) => {
            state.currentQuestion = null;
            state.error = null;
        },
        clearQuestionsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // --- Create Question ---
            .addCase(createQuestion.pending, (state) => { 
                state.loading = true; 
                state.error = null; 
            })
            .addCase(createQuestion.fulfilled, (state, action) => {
                state.loading = false;
                state.questions.push(action.payload);
            })
            .addCase(createQuestion.rejected, (state, action) => { 
                state.loading = false; 
                state.error = action.payload; 
            })

            // --- Bulk Create ---
            .addCase(bulkCreateQuestions.pending, (state) => { 
                state.loading = true; 
                state.error = null; 
            })
            .addCase(bulkCreateQuestions.fulfilled, (state, action) => {
                state.loading = false;
                state.questions.push(...action.payload);
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
                state.questions = action.payload;
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
            .addCase(updateQuestion.pending, (state) => {
                 state.loading = true; 
                 state.error = null; })
            .addCase(updateQuestion.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.questions.findIndex(q => q._id === action.payload._id);
                if (index !== -1) state.questions[index] = action.payload;
                if (state.currentQuestion?._id === action.payload._id) state.currentQuestion = action.payload;
            })
            .addCase(updateQuestion.rejected, (state, action) => { 
                state.loading = false; 
                state.error = action.payload; 
            })

            // --- Delete Question ---
            .addCase(deleteQuestion.pending, (state) => { 
                state.loading = true; 
                state.error = null; 
            })
            .addCase(deleteQuestion.fulfilled, (state, action) => {
                state.loading = false;
                state.questions = state.questions.filter(q => q._id !== action.payload._id);
            })
            .addCase(deleteQuestion.rejected, (state, action) => { 
                state.loading = false; 
                state.error = action.payload; 
            })

            // --- Toggle Status ---
            .addCase(toggleQuestionStatus.pending, (state) => { 
                state.loading = true; 
                state.error = null; 
            })
            .addCase(toggleQuestionStatus.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.questions.findIndex(q => q._id === action.payload._id);
                if (index !== -1) state.questions[index] = action.payload;
                if (state.currentQuestion?._id === action.payload._id) state.currentQuestion = action.payload;
            })
            .addCase(toggleQuestionStatus.rejected, (state, action) => { 
                state.loading = false; 
                state.error = action.payload;
             });
    },
});

export const { clearCurrentQuestion, clearQuestionsError } = questionSlice.actions;
export default questionSlice.reducer;

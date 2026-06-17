import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchFaqs = createAsyncThunk(
  "faqs/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/faqs", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch FAQs");
    }
  }
);

export const createFaq = createAsyncThunk(
  "faqs/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/faqs", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create FAQ");
    }
  }
);

export const updateFaq = createAsyncThunk(
  "faqs/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/faqs/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update FAQ");
    }
  }
);

export const deleteFaq = createAsyncThunk(
  "faqs/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/faqs/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete FAQ");
    }
  }
);

const faqSlice = createSlice({
  name: "faqs",
  initialState: {
    faqs: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFaqs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFaqs.fulfilled, (state, action) => { state.loading = false; state.faqs = action.payload || []; })
      .addCase(fetchFaqs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createFaq.fulfilled, (state, action) => { state.faqs.unshift(action.payload); })

      .addCase(updateFaq.fulfilled, (state, action) => {
        const idx = state.faqs.findIndex(f => f._id === action.payload._id);
        if (idx !== -1) state.faqs[idx] = action.payload;
      })

      .addCase(deleteFaq.fulfilled, (state, action) => {
        state.faqs = state.faqs.filter(f => f._id !== action.payload);
      });
  },
});

export default faqSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchDesignations = createAsyncThunk(
  "designations/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/designations", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch designations");
    }
  }
);

export const createDesignation = createAsyncThunk(
  "designations/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/designations", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create designation");
    }
  }
);

export const updateDesignation = createAsyncThunk(
  "designations/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/designations/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update designation");
    }
  }
);

export const deleteDesignation = createAsyncThunk(
  "designations/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/designations/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete designation");
    }
  }
);

const designationSlice = createSlice({
  name: "designations",
  initialState: {
    designations: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesignations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.loading = false;
        state.designations = action.payload?.designations || action.payload || [];
        state.total = action.payload?.total || 0;
      })
      .addCase(fetchDesignations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createDesignation.fulfilled, (state, action) => {
        state.designations.unshift(action.payload);
        state.total += 1;
      })

      .addCase(updateDesignation.fulfilled, (state, action) => {
        const idx = state.designations.findIndex(d => d._id === action.payload._id);
        if (idx !== -1) state.designations[idx] = action.payload;
      })

      .addCase(deleteDesignation.fulfilled, (state, action) => {
        state.designations = state.designations.filter(d => d._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export default designationSlice.reducer;

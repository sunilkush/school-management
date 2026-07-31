import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) => err?.response?.data?.message || fallback;

export const fetchGradingScale = createAsyncThunk(
  "gradingScale/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/grading-scale");
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch grading scale"));
    }
  }
);

export const updateGradingScale = createAsyncThunk(
  "gradingScale/update",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/grading-scale", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to save grading scale"));
    }
  }
);

const gradingScaleSlice = createSlice({
  name: "gradingScale",
  initialState: {
    scale: null,
    isDefault: false,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGradingScale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGradingScale.fulfilled, (state, action) => {
        state.loading = false;
        state.scale = action.payload;
        state.isDefault = Boolean(action.payload?.isDefault);
      })
      .addCase(fetchGradingScale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateGradingScale.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateGradingScale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.scale = action.payload;
        state.isDefault = false;
      })
      .addCase(updateGradingScale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export default gradingScaleSlice.reducer;

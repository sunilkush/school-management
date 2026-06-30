import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchIpRules = createAsyncThunk(
  "ipRestriction/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/ip-restrictions", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch IP rules");
    }
  }
);

export const createIpRule = createAsyncThunk(
  "ipRestriction/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/ip-restrictions", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create IP rule");
    }
  }
);

export const updateIpRule = createAsyncThunk(
  "ipRestriction/update",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/ip-restrictions/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update IP rule");
    }
  }
);

export const toggleIpRule = createAsyncThunk(
  "ipRestriction/toggle",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/ip-restrictions/${id}/toggle`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle IP rule");
    }
  }
);

export const deleteIpRule = createAsyncThunk(
  "ipRestriction/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/ip-restrictions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete IP rule");
    }
  }
);

const ipRestrictionSlice = createSlice({
  name: "ipRestriction",
  initialState: {
    rules: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearIpState: (state) => { state.error = null; state.success = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; state.success = null; };
    const failed = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchIpRules.pending, pending)
      .addCase(fetchIpRules.fulfilled, (state, action) => {
        state.loading = false;
        state.rules = action.payload || [];
      })
      .addCase(fetchIpRules.rejected, failed)

      .addCase(createIpRule.pending, pending)
      .addCase(createIpRule.fulfilled, (state, action) => {
        state.loading = false;
        state.rules.unshift(action.payload);
        state.success = "IP rule added";
      })
      .addCase(createIpRule.rejected, failed)

      .addCase(updateIpRule.pending, pending)
      .addCase(updateIpRule.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.rules.findIndex((r) => r._id === action.payload._id);
        if (idx !== -1) state.rules[idx] = action.payload;
        state.success = "IP rule updated";
      })
      .addCase(updateIpRule.rejected, failed)

      .addCase(toggleIpRule.pending, pending)
      .addCase(toggleIpRule.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.rules.findIndex((r) => r._id === action.payload._id);
        if (idx !== -1) state.rules[idx] = action.payload;
      })
      .addCase(toggleIpRule.rejected, failed)

      .addCase(deleteIpRule.pending, pending)
      .addCase(deleteIpRule.fulfilled, (state, action) => {
        state.loading = false;
        state.rules = state.rules.filter((r) => r._id !== action.payload);
        state.success = "IP rule deleted";
      })
      .addCase(deleteIpRule.rejected, failed);
  },
});

export const { clearIpState } = ipRestrictionSlice.actions;
export default ipRestrictionSlice.reducer;

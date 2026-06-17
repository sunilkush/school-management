import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchGlobalConfig = createAsyncThunk(
  "globalConfig/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/global-config");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch config");
    }
  }
);

export const updateGlobalConfig = createAsyncThunk(
  "globalConfig/update",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/global-config", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update config");
    }
  }
);

const globalConfigSlice = createSlice({
  name: "globalConfig",
  initialState: {
    config: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalConfig.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGlobalConfig.fulfilled, (state, action) => { state.loading = false; state.config = action.payload; })
      .addCase(fetchGlobalConfig.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateGlobalConfig.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateGlobalConfig.fulfilled, (state, action) => { state.saving = false; state.config = action.payload; })
      .addCase(updateGlobalConfig.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export default globalConfigSlice.reducer;

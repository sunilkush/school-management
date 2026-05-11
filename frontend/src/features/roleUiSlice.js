import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";



export const fetchMyPermissions = createAsyncThunk(
  "roleUi/fetchMyPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/user/my-permissions`);

      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch role permissions"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { loading, permissions } = getState().roleUi || {};
      return !loading && (!Array.isArray(permissions) || permissions.length === 0);
    },
  }
);

const roleUiSlice = createSlice({
  name: "roleUi",
  initialState: {
    role: null,
    permissions: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRoleUiState: (state) => {
      state.role = null;
      state.permissions = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.role = action.payload?.role || null;
        state.permissions = action.payload?.permissions || [];
      })
      .addCase(fetchMyPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearRoleUiState } = roleUiSlice.actions;
export default roleUiSlice.reducer;

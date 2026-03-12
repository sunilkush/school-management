import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchMyPermissions = createAsyncThunk(
  "roleUi/fetchMyPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return rejectWithValue("Access token missing");

      const res = await axios.get(`${API_BASE_URL}/user/my-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch role permissions"
      );
    }
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

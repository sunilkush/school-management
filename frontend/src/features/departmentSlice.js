import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/departments", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch departments");
    }
  }
);

export const createDepartment = createAsyncThunk(
  "departments/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/departments", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create department");
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "departments/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/departments/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update department");
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "departments/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/departments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete department");
    }
  }
);

const departmentSlice = createSlice({
  name: "departments",
  initialState: {
    departments: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload?.departments || action.payload || [];
        state.total = action.payload?.total || 0;
      })
      .addCase(fetchDepartments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.unshift(action.payload);
        state.total += 1;
      })

      .addCase(updateDepartment.fulfilled, (state, action) => {
        const idx = state.departments.findIndex(d => d._id === action.payload._id);
        if (idx !== -1) state.departments[idx] = action.payload;
      })

      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter(d => d._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export default departmentSlice.reducer;

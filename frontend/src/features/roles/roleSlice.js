import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// API base
const api =
  "https://legendary-goldfish-54v4wvqgwxr364q-9000.app.github.dev/app/v1/role";

// Async thunk to fetch role by ID
export const fetchRoleById = createAsyncThunk(
  "role/fetchRoleById",
  async (roleId, thunkAPI) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${api}/getRole/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res.data.data);
      return res.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  }
);

const roleSlice = createSlice({
  name: "role",
  initialState: {
    role: {},
    permissions: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.role = null;
        state.permissions = null;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        const { data, permissions } = action.payload;
        state.role = data; 
        state.permissions = permissions;
        state.loading = false;
        localStorage.setItem('data')
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default roleSlice.reducer;

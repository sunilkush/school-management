import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// API base URL
const api = "http://localhost:9000/app/v1/role";

// Fetch all roles
export const fetchRoles = createAsyncThunk(
  "role/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      debugger;
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${api}/getAllRoles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
       console.log(res.data.data)
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Role list not accessible!"
      );
    }
  }
);

// Fetch role by ID
export const fetchRoleById = createAsyncThunk(
  "role/fetchRoleById",
  async (roleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${api}/getRole/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  }
);

// Initial state
const initialState = {
  roles: [],
  role: null,
  loading: false,
  error: null,
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload?.data || [];
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch role by ID
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.role = null;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.role = action.payload?.data || null;
        localStorage.setItem("role", JSON.stringify(action.payload?.data));
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default roleSlice.reducer;

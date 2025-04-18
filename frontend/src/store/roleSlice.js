import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk with token in headers
export const fetchRoles = createAsyncThunk("roles/fetchRoles", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token"); // Get access token

    const response = await axios.get("http://localhost:9000/api/v1/role/getAllRoles", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

   
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch roles");
  }
});

const roleSlice = createSlice({
  name: "roles",
  initialState: {
    roles: [],
    status: "idle",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default roleSlice.reducer;

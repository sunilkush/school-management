import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk with token in headers
export const getRole = createAsyncThunk("role/getRole", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(
      `https://legendary-goldfish-54v4wvqgwxr364q-9000.app.github.dev/app/v1/role/getAllRoles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch roles");
  }
});


const roleSlice = createSlice({
  name: "role",
  initialState: {
    roles: [],
    status: "idle",
    error: null,
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRole.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRole.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roles = action.payload;
      })
      .addCase(getRole.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default roleSlice.reducer;

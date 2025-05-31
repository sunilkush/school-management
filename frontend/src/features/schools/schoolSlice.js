import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch all schools
export const fetchSchools = createAsyncThunk(
  "school/fetchSchools",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.get("http://localhost:9000/app/v1/school/getAllSchool", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.data.schools;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School list not found!"
      );
    }
  }
);

// Initial state
const initialState = {
  schools: [],         // changed from 'school' to 'schools' (plural for clarity)
  loading: false,
  error: null,
};

// Slice
const schoolSlice = createSlice({
  name: "school",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchools.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.loading = false;
        state.schools = action.payload;
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default schoolSlice.reducer;

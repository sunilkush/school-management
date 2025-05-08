import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from "axios";

// Async thunk to fetch schools
export const fetchSchools = createAsyncThunk(
  "schools/fetchSchools",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:9000/app/v1/school/getAllSchool",{
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(response)
      return response.data.data.schools;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch schools"
      );
    }
  }
);

const schoolsSlice = createSlice({
  name: "schools",
  initialState: {
    schools: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchools.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.schools = action.payload;
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default schoolsSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch schools
export const fetchSchools = createAsyncThunk(
  "school/fetchSchools",
  async (_, { rejectWithValue }) => {
    
    try {
        debugger;
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("http://localhost:9000/app/v1/school", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res.data)
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School list not found!"
      );
    }
  }
);

const initialState = {
  school: [],
  loading: false,
  error: null,
};

const SchoolSlice = createSlice({
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
        state.school = action.payload;
        state.error = null;
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default SchoolSlice.reducer;

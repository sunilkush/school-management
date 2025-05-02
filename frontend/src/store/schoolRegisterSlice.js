import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to register school
export const registerSchool = createAsyncThunk(
  "schools/register",
  async (schoolData, { rejectWithValue }) => {
    try {
    
      const token = localStorage.getItem("token");
    
      const response = await axios.post(
        "https://legendary-goldfish-54v4wvqgwxr364q-9000.app.github.dev/app/v1/school/register",
        schoolData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "School registration failed.";
      return rejectWithValue(message);
    }
  }
);

const schoolRegisterSlice = createSlice({
  name: "schoolRegister",
  initialState: {
    schoolRegister: null,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(registerSchool.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerSchool.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.schoolRegister = action.payload;
      })
      .addCase(registerSchool.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default schoolRegisterSlice.reducer;

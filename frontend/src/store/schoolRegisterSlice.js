import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

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
      return response;
    } catch (error) {
      if (error.response && error.response.data?.message) {
        return rejectWithValue(error.response?.data?.message);
      } else {
        return rejectWithValue("Registration failed. Please try again.");
      }
    }
  }
);

const schoolRegisterSlice = createSlice({
  name: "SchoolRegister",
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
        state.user = action.payload;
      })
      .addCase(registerSchool.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload; // Fixed: payload is already a string
      });
  },
});

export default schoolRegisterSlice.reducer;

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

// Create school
export const addSchool = createAsyncThunk(
  "school/create",
  async (schoolData, { rejectWithValue }) => {
    try {
      console.log(schoolData)
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.post(
        "http://localhost:9000/app/v1/school/register",
        schoolData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return res.data.data; // Ensure your backend returns { school, message }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School doesn't register"
      );
    }
  }
);

// Initial state
const initialState = {
  schools: [],
  school: [],
  loading: false,
  error: null,
  message: null,
  success: false, // ✅ added
};

// Slice
const schoolSlice = createSlice({
  name: "school",
  initialState,
  reducers: {
    resetSchoolState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSchools
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
      })

      // addSchool
      .addCase(addSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
        state.success = false;
      })
      .addCase(addSchool.fulfilled, (state, action) => {
        state.loading = false;
        state.school.push(action.payload.school);
        state.message = action.payload.message;
        state.success = true;
      })
      .addCase(addSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetSchoolState } = schoolSlice.actions;
export default schoolSlice.reducer;

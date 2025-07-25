import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL
// Async thunk to fetch all schools
export const fetchSchools = createAsyncThunk(
  "school/fetchSchools",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.get(`${Api_Base_Url}/school/getAllSchool`, {
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
        `${Api_Base_Url}/school/register`,
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
  status: 'idle',
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
        state.status = "loading";
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.loading = false;
        state.schools = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = "failed";
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

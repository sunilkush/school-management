import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// ✅ Create Academic Year
export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (data, { rejectWithValue }) => {
    try {
   
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(`${Api_Base_Url}/academicYear/create`, data,{
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.academicYear;
    } catch (err) {
      return rejectWithValue(err.response.data.message || "Server error");
    }
  }
);

// ✅ Fetch All Academic Years
export const fetchAllAcademicYears = createAsyncThunk(
  "academicYear/fetchAll",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${Api_Base_Url}/academicYear/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch academic years");
    }
  }
);

// ✅ Fetch Active Academic Year
export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${Api_Base_Url}/academicYear/active/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data)
      return response.data.data; 

    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch active academic year");
    }
  }
);

// ✅ Slice
const academicYearSlice = createSlice({
  name: "academicYear",
  initialState: {
    academicYears: [],
    activeYear: null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ▶️ Create Academic Year
      .addCase(createAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic Year created successfully.";
      })
      .addCase(createAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

      // ▶️ Fetch All Academic Years
      builder.addCase(fetchAllAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      .addCase(fetchAllAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

      // ▶️ Fetch Active Academic Year
      builder
  .addCase(fetchActiveAcademicYear.pending, (state) => {
    state.loading = true;
  })
  .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
    state.loading = false;
    state.activeYear = action.payload; // payload is an object
  })
  .addCase(fetchActiveAcademicYear.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload || "Failed to load active year";
  });
  },
});

export default academicYearSlice.reducer;

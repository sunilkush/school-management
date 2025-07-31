import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// ✅ Create Academic Year
export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(`${Api_Base_Url}/academicYear/create`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to create academic year");
    }
  }
);

// ✅ Fetch All Academic Years
export const fetchAllAcademicYears = createAsyncThunk(
  "academicYear/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${Api_Base_Url}/academicYear/allYear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch academic years!");
    }
  }
);

// ✅ Fetch Active Academic Year
export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${Api_Base_Url}/academicYear/Active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch active year");
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
      // Create
      .addCase(createAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic Year Created";
      })
      .addCase(createAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch All
      .addCase(fetchAllAcademicYears.pending, (state) => {
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
      })

      // Fetch Active
      .addCase(fetchActiveAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
      })
      .addCase(fetchActiveAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default academicYearSlice.reducer;

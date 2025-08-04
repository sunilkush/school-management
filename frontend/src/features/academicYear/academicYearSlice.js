import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// ✅ Create Academic Year
export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (data, { rejectWithValue }) => {
    try {

      const token = localStorage.getItem("accessToken");
      const response = await axios.post(`${Api_Base_Url}/academicYear/create`, data, {
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
      const response = await axios.get(`${Api_Base_Url}/academicYear/active/school/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;

    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch active academic year");
    }
  }
);

export const setActiveAcademicYear = createAsyncThunk(
  "academicYear/setActive",
  async (academicYearId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.patch(
        `${Api_Base_Url}/academicYear/active/${academicYearId}`,
        {}, // empty body
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to set active academic year");
    }
  }
);

const academicYearSlice = createSlice({
  name: "academicYear",
  initialState: {
    academicYears: [],
    activeYear: null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearAcademicYearMessages: (state) => {
      state.message = null;
      state.error = null;
    },
  },
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
      })

      // ▶️ Fetch All Academic Years
      .addCase(fetchAllAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      .addCase(fetchAllAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ▶️ Fetch Active Academic Year
      .addCase(fetchActiveAcademicYear.pending, (state) => {
        state.loading = true;
        state.message = null;
        state.error = null;
      })
      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        state.message = "Active academic year loaded.";
      })
      .addCase(fetchActiveAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load active academic year.";
      })

      // ▶️ Set Active Academic Year
      .addCase(setActiveAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(setActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        state.message = "Active academic year updated successfully.";
      })
      .addCase(setActiveAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update active academic year.";
      });
  }
});

export const { clearAcademicYearMessages } = academicYearSlice.actions;
export default academicYearSlice.reducer;
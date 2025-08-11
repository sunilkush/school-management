import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("accessToken");

// Create Academic Year
export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${Api_Base_Url}/academicYear/create`, data, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch All
export const fetchAllAcademicYears = createAsyncThunk(
  "academicYear/fetchAll",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${Api_Base_Url}/academicYear/school/${schoolId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Fetch Active
export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${Api_Base_Url}/academicYear/active/${schoolId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Set Active
export const setActiveAcademicYear = createAsyncThunk(
  "academicYear/setActive",
  async (academicYearId, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${Api_Base_Url}/academicYear/activate/${academicYearId}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Archive
export const archiveAcademicYear = createAsyncThunk(
  "academicYear/archiveAcademicYear",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${Api_Base_Url}/academicYear/archive/${id}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const academicYearSlice = createSlice({
  name: "academicYear",
  initialState: {
    academicYears: [],
    activeYear: null,
    selectedAcademicYear: JSON.parse(localStorage.getItem("selectedAcademicYear")) || null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearAcademicYearMessages: (state) => {
      state.error = null;
      state.message = null;
    },
    setSelectedAcademicYear: (state, action) => {
      state.selectedAcademicYear = action.payload;
      localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic year created successfully.";
      })
      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        if (!state.selectedAcademicYear) {
          state.selectedAcademicYear = action.payload;
          localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
        }
      })
      .addCase(setActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        state.selectedAcademicYear = action.payload;
        localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
        state.message = "Active academic year updated successfully.";
        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload._id ? { ...y, isActive: true, status: "active" } : { ...y, isActive: false, status: "inactive" }
        );
      })
      .addCase(archiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload.data._id ? { ...y, isActive: false, archived: true, status: "archived" } : y
        );
        if (state.activeYear?._id === action.payload.data._id) {
          state.activeYear = null;
        }
      })
      .addMatcher((action) => action.type.endsWith("/pending"), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher((action) => action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAcademicYearMessages, setSelectedAcademicYear } = academicYearSlice.actions;
export default academicYearSlice.reducer;

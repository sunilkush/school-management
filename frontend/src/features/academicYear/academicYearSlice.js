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
      return res.data.data; // ✅ make sure backend returns { data: {...} }
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
      const res = await axios.get(
        `${Api_Base_Url}/academicYear/school/${schoolId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch Active
export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    try {
      
      const res = await axios.get(
        `${Api_Base_Url}/academicYear/active/${schoolId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
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
      const res = await axios.post(
        `${Api_Base_Url}/academicYear/activate/${academicYearId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Archive
export const archiveAcademicYear = createAsyncThunk(
  "academicYear/archive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${Api_Base_Url}/academicYear/archive/${id}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data; // ✅ ensure backend returns { message, data: {...} }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const academicYearSlice = createSlice({
  name: "academicYear",
  initialState: {
    academicYears: [],
    activeYear: null,
    selectedAcademicYear:
      JSON.parse(localStorage.getItem("selectedAcademicYear")) || null,
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
      // Create
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic year created successfully.";
      })
      // Fetch All
      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      // Fetch Active
      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        if (!state.selectedAcademicYear) {
          state.selectedAcademicYear = action.payload;
          localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
        }
      })
      // Set Active
      .addCase(setActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        state.selectedAcademicYear = action.payload;
        localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
        state.message = "Active academic year updated successfully.";
        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload._id
            ? { ...y, isActive: true, archived: false }
            : { ...y, isActive: false }
        );
      })
      // Archive
      .addCase(archiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload.data._id
            ? { ...y, isActive: false, archived: true }
            : y
        );
        if (state.activeYear?._id === action.payload.data._id) {
          state.activeYear = null;
        }
      })
      // Handle pending
      .addMatcher((action) => action.type.endsWith("/pending"), (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle rejected
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearAcademicYearMessages, setSelectedAcademicYear } =
  academicYearSlice.actions;
export default academicYearSlice.reducer;

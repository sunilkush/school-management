import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const Api_Base_Url = import.meta.env.VITE_API_URL;
// ⬇️ Get token from localStorage
const token = localStorage.getItem("accessToken");

// 🔄 Async Thunks
export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${Api_Base_Url}/academicYear/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllAcademicYears = createAsyncThunk(
  "academicYear/fetchAll",
  async (schoolId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${Api_Base_Url}/academicYear/school/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${Api_Base_Url}/academicYear/active/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const setActiveAcademicYear = createAsyncThunk(
  "academicYear/setActive",
  async (academicYearId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${Api_Base_Url}/academicYear/activate/${academicYearId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const archiveAcademicYear = createAsyncThunk(
  'academicYear/archiveAcademicYear',
  async ({ id }, { rejectWithValue }) => {
    try {
     
      const res = await axios.post(`${Api_Base_Url}/academicYear/archive/${id}`,
        {
        headers: { Authorization: `Bearer ${token}` },
      }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// 🔧 Slice
const academicYearSlice = createSlice({
  name: "academicYear",
  initialState: {
    academicYears: [],
    activeYear: null,
    selectedAcademicYear: localStorage.getItem("selectedAcademicYear")
      ? JSON.parse(localStorage.getItem("selectedAcademicYear"))
      : null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearAcademicYearMessages: (state) => {
      state.error = null;
      state.message = null;
    },
    resetAcademicYearState: (state) => {
      state.academicYears = [];
      state.activeYear = null;
      state.selectedAcademicYear = null;
      state.loading = false;
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
      // ✅ Create Year
      .addCase(createAcademicYear.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic year created successfully.";
      })
      .addCase(createAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch All Years
      .addCase(fetchAllAcademicYears.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      .addCase(fetchAllAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch Active Year
      .addCase(fetchActiveAcademicYear.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        if (!state.selectedAcademicYear) {
          state.selectedAcademicYear = action.payload;
          localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
        }
      })
      .addCase(fetchActiveAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Set Active Year
      .addCase(setActiveAcademicYear.pending, (state) => {
        state.loading = true;
      })
      .addCase(setActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        state.selectedAcademicYear = action.payload;
        localStorage.setItem("selectedAcademicYear", JSON.stringify(action.payload));
        state.message = "Active academic year updated successfully.";

        // 🔁 Update list
        state.academicYears = state.academicYears.map((year) =>
          year._id === action.payload._id
            ? { ...year, status: "active", isActive: true }
            : { ...year, status: "inactive", isActive: false }
        );
      })
      .addCase(archiveAcademicYear.pending, (state) => {
        state.loading = true;
        
      })
      .addCase(archiveAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(archiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.academicYears = state.academicYears.map((year) =>
          year._id === action.payload.data._id
            ? { ...year, status: "archived", isActive: false }
            : year
        );
      });
  },
});

export const {
  clearAcademicYearMessages,
  resetAcademicYearState,
  setSelectedAcademicYear,
} = academicYearSlice.actions;

export default academicYearSlice.reducer;

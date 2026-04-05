import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ================= CREATE ================= */

export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/academicYear/create`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= FETCH ALL ================= */

export const fetchAllAcademicYears = createAsyncThunk(
  "academicYear/fetchAll",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/academicYear/school/${schoolId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= FETCH ACTIVE ================= */

export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/academicYear/active/${schoolId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= SET ACTIVE ================= */

export const setActiveAcademicYear = createAsyncThunk(
  "academicYear/setActive",
  async (academicYearId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/academicYear/activate/${academicYearId}`
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= ARCHIVE ================= */

export const archiveAcademicYear = createAsyncThunk(
  "academicYear/archive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/academicYear/archive/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= DELETE ================= */

export const deleteAcademicYear = createAsyncThunk(
  "academicYear/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/academicYear/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= UPDATE ================= */

export const updateAcademicYear = createAsyncThunk(
  "academicYear/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/academicYear/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= SLICE ================= */

const academicYearSlice = createSlice({
  name: "academicYear",

  initialState: {
    academicYears: [],
    activeYear: null,
    selectedAcademicYear: null,
    loading: false,
    error: null,
    message: null,
    isFetched: false, 
  },

  reducers: {
    clearAcademicYearMessages: (state) => {
      state.error = null;
      state.message = null;
    },

    setSelectedAcademicYear: (state, action) => {
      state.selectedAcademicYear = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= CREATE ================= */

      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic year created successfully";
      })

      /* ================= FETCH ALL ================= */

      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })

      /* ================= FETCH ACTIVE ================= */

      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;
        state.isFetched = true; 
        // 🔥 auto sync
        if (!state.selectedAcademicYear) {
          state.selectedAcademicYear = action.payload;
        }
      })

      /* ================= SET ACTIVE ================= */

      .addCase(setActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;

        state.activeYear = action.payload;
        state.selectedAcademicYear = action.payload;

        state.message = "Active academic year updated";

        // 🔥 sync list
        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload._id
            ? { ...y, isActive: true, archived: false }
            : { ...y, isActive: false }
        );
      })

      /* ================= ARCHIVE ================= */

      .addCase(archiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;

        const archivedId = action.payload.data._id;

        state.academicYears = state.academicYears.map((y) =>
          y._id === archivedId
            ? { ...y, isActive: false, archived: true }
            : y
        );

        // 🔥 reset if active deleted
        if (state.activeYear?._id === archivedId) {
          state.activeYear = null;
          state.selectedAcademicYear = null;
        }
      })

      /* ================= DELETE ================= */

      .addCase(deleteAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;

        const deletedId = action.payload.data._id;

        state.academicYears = state.academicYears.filter(
          (y) => y._id !== deletedId
        );

        if (state.activeYear?._id === deletedId) {
          state.activeYear = null;
          state.selectedAcademicYear = null;
        }
      })

      /* ================= UPDATE ================= */

      .addCase(updateAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Academic year updated";

        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload._id ? action.payload : y
        );

        // 🔥 important sync
        if (state.selectedAcademicYear?._id === action.payload._id) {
          state.selectedAcademicYear = action.payload;
        }

        if (state.activeYear?._id === action.payload._id) {
          state.activeYear = action.payload;
        }
      })

      /* ================= PENDING ================= */

      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /* ================= REJECTED ================= */

      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || "Something went wrong";
        }
      );
  },
});

export const {
  clearAcademicYearMessages,
  setSelectedAcademicYear,
} = academicYearSlice.actions;

export default academicYearSlice.reducer;
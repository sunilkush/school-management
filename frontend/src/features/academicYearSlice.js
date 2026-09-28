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

// The layout, the top-bar switcher and the class loader can all ask for the active year at the
// same moment on first load; they share one request instead of sending three.
const activeYearRequests = new Map();

export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    const key = String(schoolId);
    if (!activeYearRequests.has(key)) {
      activeYearRequests.set(
        key,
        apiClient.get(`/academicYear/active/${schoolId}`).finally(() => activeYearRequests.delete(key))
      );
    }
    try {
      const res = await activeYearRequests.get(key);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/**
 * For thunks that list year-scoped data (classes, exams): the id of the school's active year, to
 * use when the caller named none. Schools keep next year's classes / exams alongside this year's,
 * so an unscoped list mixes the two. Waits for the year if it has not been loaded yet (first load,
 * phone) — sharing the layout's request — instead of falling back to every year.
 *
 * Returns undefined (= do not add a year) for roles in `skipRoles`: Super Admin browses other
 * schools, and Student / Parent lists are scoped server-side by the child's own enrolment.
 */
export const resolveActiveYearId = async (
  { getState, dispatch },
  skipRoles = ["Super Admin"]
) => {
  const { academicYear = {}, auth = {} } = getState() || {};
  const user = auth.user;
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name || user?.roleId?.name || "";
  if (!user || skipRoles.includes(roleName)) return undefined;

  let year = academicYear.selectedAcademicYear || academicYear.activeYear;
  const schoolId = user.school?._id || user.schoolId?._id || user.schoolId;
  if (!year?._id && schoolId) {
    year = await dispatch(fetchActiveAcademicYear(schoolId)).unwrap().catch(() => null);
  }
  return year?._id || undefined;
};

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
      // Backend returns only { success, message } — no data payload — so the
      // deleted id has to travel from the request itself, not the response.
      return { ...res.data, deletedId: id };
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
            ? { ...y, isActive: false, status: "archived" }
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

        const deletedId = action.payload.deletedId;

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
        (action) => action.type.startsWith("academicYear/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /* ================= REJECTED ================= */

      .addMatcher(
        (action) => action.type.startsWith("academicYear/") && action.type.endsWith("/rejected"),
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
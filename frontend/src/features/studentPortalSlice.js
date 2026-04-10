import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) => err?.response?.data?.message || fallback;

export const fetchStudentGrades = createAsyncThunk(
  "studentPortal/fetchStudentGrades",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/me/grades");
      return res.data?.data?.grades || [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch grades"));
    }
  }
);

export const fetchStudentTimetable = createAsyncThunk(
  "studentPortal/fetchStudentTimetable",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/me/timetable");
      return res.data?.data?.timetable || [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch timetable"));
    }
  }
);

export const fetchStudentTransport = createAsyncThunk(
  "studentPortal/fetchStudentTransport",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/me/transport");
      return res.data?.data?.assignment || null;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch transport details"));
    }
  }
);

export const fetchStudentLibraryBooks = createAsyncThunk(
  "studentPortal/fetchStudentLibraryBooks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/me/library-books");
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch library books"));
    }
  }
);

const initialState = {
  grades: [],
  timetable: [],
  transportAssignment: null,
  libraryBooks: [],
  loading: false,
  error: null,
};

const studentPortalSlice = createSlice({
  name: "studentPortal",
  initialState,
  reducers: {
    clearStudentPortalError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setPending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const setRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error?.message;
    };

    builder
      .addCase(fetchStudentGrades.pending, setPending)
      .addCase(fetchStudentGrades.fulfilled, (state, action) => {
        state.loading = false;
        state.grades = action.payload;
      })
      .addCase(fetchStudentGrades.rejected, setRejected)

      .addCase(fetchStudentTimetable.pending, setPending)
      .addCase(fetchStudentTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.timetable = action.payload;
      })
      .addCase(fetchStudentTimetable.rejected, setRejected)

      .addCase(fetchStudentTransport.pending, setPending)
      .addCase(fetchStudentTransport.fulfilled, (state, action) => {
        state.loading = false;
        state.transportAssignment = action.payload;
      })
      .addCase(fetchStudentTransport.rejected, setRejected)

      .addCase(fetchStudentLibraryBooks.pending, setPending)
      .addCase(fetchStudentLibraryBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.libraryBooks = action.payload;
      })
      .addCase(fetchStudentLibraryBooks.rejected, setRejected);
  },
});

export const { clearStudentPortalError } = studentPortalSlice.actions;
export default studentPortalSlice.reducer;

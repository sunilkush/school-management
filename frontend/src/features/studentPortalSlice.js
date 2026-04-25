import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) => err?.response?.data?.message || fallback;


const normalizeTransportAssignment = (assignment) => {
  if (!assignment) return null;

  return {
    ...assignment,
    routeName: assignment?.routeId?.name || assignment?.routeName || "",
    vehicleNumber:
      assignment?.vehicleId?.busNumber || assignment?.vehicleNumber || "",
    stopName: assignment?.pickupStop || assignment?.stopName || "",
  };
};

const normalizeTimetableEntry = (entry) => {
  if (!entry) return entry;

  return {
    ...entry,
    subject: entry?.subjectId || null,
    teacher: entry?.teacherId || null,
  };
};

const normalizeGrade = (grade) => {
  if (!grade) return grade;

  const firstSubject = Array.isArray(grade?.subjects) ? grade.subjects[0] : null;

  return {
    ...grade,
    subjectName:
      firstSubject?.subjectName || firstSubject?.subjectId?.name || "Subject",
    examName: grade?.examId?.title || grade?.examName || "Assessment",
    score: Number.isFinite(Number(grade?.percentage))
      ? Number(grade.percentage)
      : null,
  };
};

export const fetchStudentGrades = createAsyncThunk(
  "studentPortal/fetchStudentGrades",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/me/grades");
      return (res.data?.data?.grades || []).map(normalizeGrade);
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
      return (res.data?.data?.timetable || []).map(normalizeTimetableEntry);
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
      return normalizeTransportAssignment(res.data?.data?.assignment || null);
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
export const fetchStudentProfile = createAsyncThunk(
  "studentPortal/fetchStudentProfile",
  async (_, { rejectWithValue }) => {
    try {
       const res = await apiClient.get("/student-portal/me/profile");
      return res.data?.data || null;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch student profile"));
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  "studentPortal/updateStudentProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/student-portal/me/profile", payload);
      return res.data?.data || null;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to update student profile"));
    }
  }
);

export const fetchStudentEnrollment = createAsyncThunk(
  "studentPortal/fetchStudentEnrollment",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/my/enrollment-id");
      return res.data?.data || null;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch student enrollment"));
    }
  }
);

export const fetchMyChildren = createAsyncThunk(
  "studentPortal/fetchMyChildren",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student-portal/my-children");
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch children"));
    }
  }
);

const initialState = {
  children: [],
  profile: null,
  enrollment: null,
  grades: [],
  timetable: [],
  transportAssignment: null,
  libraryBooks: [],
  loading: false,
  pendingRequests: 0,
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
       state.pendingRequests += 1;
      state.loading = true;
      state.error = null;
    };
    const setFulfilled = (state) => {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
      state.loading = state.pendingRequests > 0;
    };
    const setRejected = (state, action) => {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
      state.loading = state.pendingRequests > 0;
      state.error = action.payload || action.error?.message;
    };

    builder
      .addCase(fetchStudentGrades.pending, setPending)
      .addCase(fetchStudentGrades.fulfilled, (state, action) => {
        setFulfilled(state);
        state.grades = action.payload;
      })
      .addCase(fetchStudentGrades.rejected, setRejected)

      .addCase(fetchStudentTimetable.pending, setPending)
      .addCase(fetchStudentTimetable.fulfilled, (state, action) => {
        setFulfilled(state);
        state.timetable = action.payload;
      })
      .addCase(fetchStudentTimetable.rejected, setRejected)

      .addCase(fetchStudentTransport.pending, setPending)
      .addCase(fetchStudentTransport.fulfilled, (state, action) => {
        setFulfilled(state);
        state.transportAssignment = action.payload;
      })
      .addCase(fetchStudentTransport.rejected, setRejected)

      .addCase(fetchStudentLibraryBooks.pending, setPending)
      .addCase(fetchStudentLibraryBooks.fulfilled, (state, action) => {
        setFulfilled(state);
        state.libraryBooks = action.payload;
      })
      .addCase(fetchStudentLibraryBooks.rejected, setRejected)

      .addCase(fetchMyChildren.pending, setPending)
      .addCase(fetchMyChildren.fulfilled, (state, action) => {
        setFulfilled(state);
        state.children = action.payload;
      })
      .addCase(fetchMyChildren.rejected, setRejected)

      .addCase(fetchStudentProfile.pending, setPending)
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        setFulfilled(state);
        state.profile = action.payload;
      })
      .addCase(fetchStudentProfile.rejected, setRejected)

      .addCase(updateStudentProfile.pending, setPending)
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        setFulfilled(state);
        state.profile = action.payload;
      })
      .addCase(updateStudentProfile.rejected, setRejected)

      .addCase(fetchStudentEnrollment.pending, setPending)
      .addCase(fetchStudentEnrollment.fulfilled, (state, action) => {
        setFulfilled(state);
        state.enrollment = action.payload;
      })
      .addCase(fetchStudentEnrollment.rejected, setRejected);
  },
});

export const { clearStudentPortalError } = studentPortalSlice.actions;
export default studentPortalSlice.reducer;

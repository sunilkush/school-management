import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// ── Books ─────────────────────────────────────────────────────────────────────
export const fetchLibraryBooks = createAsyncThunk(
  "library/fetchBooks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/books");
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch books"));
    }
  }
);

export const createLibraryBook = createAsyncThunk(
  "library/createBook",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/books", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to create book"));
    }
  }
);

export const updateLibraryBook = createAsyncThunk(
  "library/updateBook",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/books/${id}`, payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to update book"));
    }
  }
);

export const deleteLibraryBook = createAsyncThunk(
  "library/deleteBook",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/books/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to delete book"));
    }
  }
);

// ── Issued Books ──────────────────────────────────────────────────────────────
export const fetchIssuedBooks = createAsyncThunk(
  "library/fetchIssuedBooks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/issuedBooks");
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch issued books"));
    }
  }
);

export const issueLibraryBook = createAsyncThunk(
  "library/issueBook",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/issuedBooks/issue", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to issue book"));
    }
  }
);

export const returnLibraryBook = createAsyncThunk(
  "library/returnBook",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/issuedBooks/return/${id}`, { status });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to return book"));
    }
  }
);

export const collectLibraryFine = createAsyncThunk(
  "library/collectFine",
  async ({ id, action, note }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/issuedBooks/${id}/fine`, { action, note });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to update fine"));
    }
  }
);

export const deleteIssuedBook = createAsyncThunk(
  "library/deleteIssuedBook",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/issuedBooks/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to delete issued record"));
    }
  }
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchLibraryDashboard = createAsyncThunk(
  "library/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/issuedBooks/dashboard");
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch dashboard"));
    }
  }
);

export const fetchOverdueBooks = createAsyncThunk(
  "library/fetchOverdue",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/issuedBooks/overdue");
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch overdue books"));
    }
  }
);

export const fetchFineSummary = createAsyncThunk(
  "library/fetchFines",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/issuedBooks/fines");
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch fines"));
    }
  }
);

// ── Library Settings ──────────────────────────────────────────────────────────
export const fetchLibrarySettings = createAsyncThunk(
  "library/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/library-settings");
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch settings"));
    }
  }
);

export const updateLibrarySettings = createAsyncThunk(
  "library/updateSettings",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/library-settings", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to update settings"));
    }
  }
);

// ── Students ──────────────────────────────────────────────────────────────────
export const fetchLibraryStudents = createAsyncThunk(
  "library/fetchStudents",
  async ({ schoolId, limit = 200 }, { rejectWithValue }) => {
    try {
      if (!schoolId) return [];
      const res = await apiClient.get("/student/school", { params: { schoolId, limit } });
      return res?.data?.data?.students || [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch students"));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const initialState = {
  books:        [],
  issuedBooks:  [],
  overdueBooks: [],
  students:     [],
  dashboard:    null,
  fines:        null,
  settings:     null,

  booksLoading:    false,
  issuedLoading:   false,
  overdueLoading:  false,
  studentsLoading: false,
  dashboardLoading:false,
  finesLoading:    false,
  settingsLoading: false,
  actionLoading:   false,
  error:           null,
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    clearLibraryError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // Books
    builder
      .addCase(fetchLibraryBooks.pending,    (s) => { s.booksLoading = true;  s.error = null; })
      .addCase(fetchLibraryBooks.fulfilled,  (s, a) => { s.booksLoading = false; s.books = a.payload; })
      .addCase(fetchLibraryBooks.rejected,   (s, a) => { s.booksLoading = false; s.error = a.payload; })

    // Issued
      .addCase(fetchIssuedBooks.pending,     (s) => { s.issuedLoading = true;  s.error = null; })
      .addCase(fetchIssuedBooks.fulfilled,   (s, a) => { s.issuedLoading = false; s.issuedBooks = a.payload; })
      .addCase(fetchIssuedBooks.rejected,    (s, a) => { s.issuedLoading = false; s.error = a.payload; })

    // Overdue
      .addCase(fetchOverdueBooks.pending,    (s) => { s.overdueLoading = true; })
      .addCase(fetchOverdueBooks.fulfilled,  (s, a) => { s.overdueLoading = false; s.overdueBooks = a.payload; })
      .addCase(fetchOverdueBooks.rejected,   (s, a) => { s.overdueLoading = false; s.error = a.payload; })

    // Students
      .addCase(fetchLibraryStudents.pending,   (s) => { s.studentsLoading = true; })
      .addCase(fetchLibraryStudents.fulfilled, (s, a) => { s.studentsLoading = false; s.students = a.payload; })
      .addCase(fetchLibraryStudents.rejected,  (s, a) => { s.studentsLoading = false; s.error = a.payload; })

    // Dashboard
      .addCase(fetchLibraryDashboard.pending,    (s) => { s.dashboardLoading = true; })
      .addCase(fetchLibraryDashboard.fulfilled,  (s, a) => { s.dashboardLoading = false; s.dashboard = a.payload; })
      .addCase(fetchLibraryDashboard.rejected,   (s, a) => { s.dashboardLoading = false; s.error = a.payload; })

    // Fines
      .addCase(fetchFineSummary.pending,    (s) => { s.finesLoading = true; })
      .addCase(fetchFineSummary.fulfilled,  (s, a) => { s.finesLoading = false; s.fines = a.payload; })
      .addCase(fetchFineSummary.rejected,   (s, a) => { s.finesLoading = false; s.error = a.payload; })

    // Settings
      .addCase(fetchLibrarySettings.pending,    (s) => { s.settingsLoading = true; })
      .addCase(fetchLibrarySettings.fulfilled,  (s, a) => { s.settingsLoading = false; s.settings = a.payload; })
      .addCase(fetchLibrarySettings.rejected,   (s, a) => { s.settingsLoading = false; s.error = a.payload; })
      .addCase(updateLibrarySettings.fulfilled, (s, a) => { s.settings = a.payload; })

    // Action matcher (create/update/delete/issue/return/fine)
      .addMatcher(
        (a) => a.type.startsWith("library/") && a.type.endsWith("/pending") &&
          !["library/fetchBooks", "library/fetchIssuedBooks", "library/fetchOverdue",
            "library/fetchStudents", "library/fetchDashboard", "library/fetchFines",
            "library/fetchSettings"].some((p) => a.type.startsWith(p)),
        (s) => { s.actionLoading = true; s.error = null; }
      )
      .addMatcher(
        (a) => a.type.startsWith("library/") && (a.type.endsWith("/fulfilled") || a.type.endsWith("/rejected")) &&
          !["library/fetchBooks", "library/fetchIssuedBooks", "library/fetchOverdue",
            "library/fetchStudents", "library/fetchDashboard", "library/fetchFines",
            "library/fetchSettings"].some((p) => a.type.startsWith(p)),
        (s, a) => {
          s.actionLoading = false;
          if (a.type.endsWith("/rejected")) s.error = a.payload;
        }
      );
  },
});

export const { clearLibraryError } = librarySlice.actions;
export default librarySlice.reducer;

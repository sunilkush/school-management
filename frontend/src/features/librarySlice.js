import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const API_PREFIX = (import.meta.env.VITE_API_URL || "/api/v1").includes("/v1")
  ? ""
  : "/v1";

const getError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

export const fetchLibraryBooks = createAsyncThunk(
  "library/fetchBooks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/books`);
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
      const res = await apiClient.post(`/books`, payload);
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

export const fetchIssuedBooks = createAsyncThunk(
  "library/fetchIssuedBooks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/issuedBooks`);
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
      const res = await apiClient.post(`/issuedBooks/issue`, payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to issue book"));
    }
  }
);

export const returnLibraryBook = createAsyncThunk(
  "library/returnBook",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/issuedBooks/return/${id}`);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Unable to return book"));
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

export const fetchLibraryStudents = createAsyncThunk(
  "library/fetchStudents",
  async ({ schoolId, limit = 100 }, { rejectWithValue }) => {
    try {
      if (!schoolId) return [];
      const res = await apiClient.get(`/student/school`, {
        params: { schoolId, limit },
      });
      return res?.data?.data?.students || [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch students"));
    }
  }
);

const initialState = {
  books: [],
  issuedBooks: [],
  students: [],
  booksLoading: false,
  issuedLoading: false,
  studentsLoading: false,
  actionLoading: false,
  error: null,
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    clearLibraryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLibraryBooks.pending, (state) => {
        state.booksLoading = true;
        state.error = null;
      })
      .addCase(fetchLibraryBooks.fulfilled, (state, action) => {
        state.booksLoading = false;
        state.books = action.payload;
      })
      .addCase(fetchLibraryBooks.rejected, (state, action) => {
        state.booksLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchIssuedBooks.pending, (state) => {
        state.issuedLoading = true;
        state.error = null;
      })
      .addCase(fetchIssuedBooks.fulfilled, (state, action) => {
        state.issuedLoading = false;
        state.issuedBooks = action.payload;
      })
      .addCase(fetchIssuedBooks.rejected, (state, action) => {
        state.issuedLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchLibraryStudents.pending, (state) => {
        state.studentsLoading = true;
      })
      .addCase(fetchLibraryStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.students = action.payload;
      })
      .addCase(fetchLibraryStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload;
      })

      .addMatcher(
        (action) =>
          action.type.startsWith("library/") &&
          action.type.endsWith("/pending") &&
          ![
            "library/fetchBooks/pending",
            "library/fetchIssuedBooks/pending",
            "library/fetchStudents/pending",
          ].includes(action.type),
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("library/") &&
          action.type.endsWith("/fulfilled") &&
          ![
            "library/fetchBooks/fulfilled",
            "library/fetchIssuedBooks/fulfilled",
            "library/fetchStudents/fulfilled",
          ].includes(action.type),
        (state) => {
          state.actionLoading = false;
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("library/") &&
          action.type.endsWith("/rejected") &&
          ![
            "library/fetchBooks/rejected",
            "library/fetchIssuedBooks/rejected",
            "library/fetchStudents/rejected",
          ].includes(action.type),
        (state, action) => {
          state.actionLoading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearLibraryError } = librarySlice.actions;
export default librarySlice.reducer;

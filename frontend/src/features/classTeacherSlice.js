import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchClassTeacherAssignments = createAsyncThunk(
  "classTeacher/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/class-teacher-assignments", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch assignments");
    }
  }
);

export const fetchMyClassTeacherAssignment = createAsyncThunk(
  "classTeacher/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/class-teacher-assignments/my");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch assignment");
    }
  }
);

export const assignClassTeacher = createAsyncThunk(
  "classTeacher/assign",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/class-teacher-assignments", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to assign");
    }
  }
);

export const removeClassTeacher = createAsyncThunk(
  "classTeacher/remove",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/class-teacher-assignments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to remove");
    }
  }
);

const classTeacherSlice = createSlice({
  name: "classTeacher",
  initialState: {
    assignments: [],
    myAssignment: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassTeacherAssignments.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchClassTeacherAssignments.fulfilled, (s, a) => { s.loading = false; s.assignments = a.payload || []; })
      .addCase(fetchClassTeacherAssignments.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMyClassTeacherAssignment.pending,   (s) => { s.loading = true; })
      .addCase(fetchMyClassTeacherAssignment.fulfilled, (s, a) => { s.loading = false; s.myAssignment = a.payload; })
      .addCase(fetchMyClassTeacherAssignment.rejected,  (s) => { s.loading = false; })

      .addCase(assignClassTeacher.pending,   (s) => { s.saving = true; })
      .addCase(assignClassTeacher.fulfilled, (s, a) => {
        s.saving = false;
        const idx = s.assignments.findIndex(
          (x) => x._id === a.payload._id
        );
        if (idx >= 0) s.assignments[idx] = a.payload;
        else s.assignments.unshift(a.payload);
      })
      .addCase(assignClassTeacher.rejected, (s) => { s.saving = false; })

      .addCase(removeClassTeacher.fulfilled, (s, a) => {
        s.assignments = s.assignments.filter((x) => x._id !== a.payload);
      });
  },
});

export default classTeacherSlice.reducer;

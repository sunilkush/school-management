import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// ======================= SECTION THUNKS ======================= //

// 🔹 Fetch Sections
export const fetchSection = createAsyncThunk(
  "section/fetchSection",
  async ({ schoolId, classId, academicYearId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId);
      if (classId) params.append("classId", classId);
      if (academicYearId) params.append("academicYearId", academicYearId);

      const res = await axios.get(`${Api_Base_Url}/section?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 🔹 Create Section
export const createSection = createAsyncThunk(
  "section/createSection",
  async (sectionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/section`, sectionData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ======================= SUBJECT THUNKS ======================= //

// 🔹 Fetch Subjects
export const fetchSubjects = createAsyncThunk(
  "subject/fetchSubjects",
  async ({ page = 1, limit = 10, search = "", schoolId, isGlobal } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams({ page, limit, search });
      if (schoolId) params.append("schoolId", schoolId);
      if (isGlobal !== undefined) params.append("isGlobal", isGlobal);

      const res = await axios.get(`${Api_Base_Url}/subject/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 🔹 Create Subject
export const createSubject = createAsyncThunk(
  "subject/createSubject",
  async (subjectData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/subject/create`, subjectData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 🔹 Assign Teachers to Subject
export const assignTeachersToSubject = createAsyncThunk(
  "subject/assignTeachers",
  async ({ subjectId, assignments }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${Api_Base_Url}/subject/assign-teachers/${subjectId}`, { assignments }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 🔹 Assign Schools to Subject
export const assignSchoolsToSubject = createAsyncThunk(
  "subject/assignSchools",
  async ({ subjectId, schoolIds }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${Api_Base_Url}/subject/assign-schools/${subjectId}`, { schoolIds }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ======================= SLICE ======================= //

const slice = createSlice({
  name: "school",
  initialState: {
    loading: false,
    error: null,
    sectionList: [],
    subjects: [],
    pagination: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    // ---------- SECTION ----------
    builder
      .addCase(fetchSection.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSection.fulfilled, (state, action) => { state.loading = false; state.sectionList = action.payload || []; })
      .addCase(fetchSection.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createSection.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createSection.fulfilled, (state, action) => { state.loading = false; state.sectionList.push(action.payload); })
      .addCase(createSection.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // ---------- SUBJECT ----------
      .addCase(fetchSubjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload.subjects || [];
        state.pagination = action.payload.pagination || {};
      })
      .addCase(fetchSubjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createSubject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createSubject.fulfilled, (state, action) => { state.loading = false; state.subjects.unshift(action.payload); })
      .addCase(createSubject.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(assignTeachersToSubject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(assignTeachersToSubject.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.subjects.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.subjects[idx] = action.payload;
      })
      .addCase(assignTeachersToSubject.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(assignSchoolsToSubject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(assignSchoolsToSubject.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.subjects.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.subjects[idx] = action.payload;
      })
      .addCase(assignSchoolsToSubject.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default slice.reducer;

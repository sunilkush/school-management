import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const API = import.meta.env.VITE_API_URL;

// 🔐 Token helper


// ==============================
// 🔹 CREATE SECTION
// ==============================
export const createSection = createAsyncThunk(
  "section/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/sections`, data, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Create section failed"
      );
    }
  }
);


// ==============================
// 🔹 FETCH ALL SECTIONS
// ==============================
export const fetchSections = createAsyncThunk(
  "section/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/sections`, {        params, // { schoolId, academicYearId, schoolClassId }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch sections failed"
      );
    }
  }
);


// ==============================
// 🔹 FETCH SINGLE
// ==============================
export const fetchSectionById = createAsyncThunk(
  "section/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/sections/${id}`, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch section failed"
      );
    }
  }
);


// ==============================
// 🔹 UPDATE SECTION
// ==============================
export const updateSection = createAsyncThunk(
  "section/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/sections/${id}`, data, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Update failed"
      );
    }
  }
);


// ==============================
// 🔹 DELETE SECTION
// ==============================
export const deleteSection = createAsyncThunk(
  "section/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/sections/${id}`, {      });
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Delete failed"
      );
    }
  }
);


// ==============================
// 🔥 ASSIGN TEACHER
// ==============================
export const assignClassTeacher = createAsyncThunk(
  "section/assignTeacher",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/sections/assign-teacher`,
        data
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Assign teacher failed"
      );
    }
  }
);


// ==============================
// 🔥 ADD STUDENT
// ==============================
export const addStudentToSection = createAsyncThunk(
  "section/addStudent",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/sections/add-student`,
        data,
        {        }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Add student failed"
      );
    }
  }
);


// ==============================
// 🔥 REMOVE STUDENT
// ==============================
export const removeStudentFromSection = createAsyncThunk(
  "section/removeStudent",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/sections/remove-student`,
        data,
        {        }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Remove student failed"
      );
    }
  }
);
export const addSubjectToSection = createAsyncThunk(
  "section/addSubjectToSection",
  async ({ schoolClassId, sectionId, subjectIds }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/sections/add-subjects`,
        {
          schoolClassId,
          sectionId,
          subjectIds,
        }
      );

      return res.data.data; // updated section
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to assign subjects"
      );
    }
  }
);

export const assignSubjectTeacher = createAsyncThunk(
  "section/assignSubjectTeacher",
  async ({ sectionId, subjectId, teacherId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/sections/assign-subject-teacher`,
        {sectionId, subjectId, teacherId}
      );
      return res.data.data; // updated section
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to assign subject teacher"
        );
      }
    }
    );
// ==============================
// 🔥 SLICE
// ==============================
const sectionSlice = createSlice({
  name: "section",
  initialState: {
    loading: false,
    error: null,
    sections: [],
    selected: null,
    success: false,
    sectionSubjects: {},
  },
  reducers: {
    resetSectionState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder

      // 🔹 FETCH ALL
      .addCase(fetchSections.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = action.payload || [];
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 CREATE
      .addCase(createSection.fulfilled, (state, action) => {
        state.sections.push(action.payload);
        state.success = true;
      })

      // 🔹 UPDATE
      .addCase(updateSection.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sections = state.sections.map((sec) =>
          sec._id === updated._id ? updated : sec
        );
        state.success = true;
      })

      // 🔹 DELETE
      .addCase(deleteSection.fulfilled, (state, action) => {
        state.sections = state.sections.filter(
          (sec) => sec._id !== action.payload
        );
        state.success = true;
      })

      // 🔥 ASSIGN TEACHER / STUDENT
      .addCase(assignClassTeacher.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sections = state.sections.map((sec) =>
          sec._id === updated._id ? updated : sec
        );
      })

      .addCase(addStudentToSection.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sections = state.sections.map((sec) =>
          sec._id === updated._id ? updated : sec
        );
      })

      .addCase(removeStudentFromSection.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sections = state.sections.map((sec) =>
          sec._id === updated._id ? updated : sec
        );
      })

      // 🔹 ADD SUBJECT
      .addCase(addSubjectToSection.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(addSubjectToSection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const section = action.payload;

        // 🔥 store subjects by sectionId
        state.sectionSubjects[section._id] = section.subjects;
      })
  
      .addCase(addSubjectToSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 ASSIGN SUBJECT TEACHER
      .addCase(assignSubjectTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(assignSubjectTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.sections = state.sections.map((sec) =>
          sec._id === action.payload._id ? action.payload : sec
        );
      })

      .addCase(assignSubjectTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export const { resetSectionState } = sectionSlice.actions;
export default sectionSlice.reducer;

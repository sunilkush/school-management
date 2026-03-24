import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// 🔐 Token helper
const getToken = () => localStorage.getItem("accessToken");


// ==============================
// 🔹 CREATE SECTION
// ==============================
export const createSection = createAsyncThunk(
  "section/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/sections`, data, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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
      const res = await axios.get(`${API}/sections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params, // { schoolId, academicYearId, schoolClassId }
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
      const res = await axios.get(`${API}/sections/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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
      const res = await axios.put(`${API}/sections/${id}`, data, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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
      await axios.delete(`${API}/sections/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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
      const res = await axios.post(
        `${API}/sections/assign-teacher`,
        data,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
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
      const res = await axios.post(
        `${API}/sections/add-student`,
        data,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
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
      const res = await axios.post(
        `${API}/sections/remove-student`,
        data,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
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
      const res = await axios.post(
        `${API}/sections/add-subjects`,
        {
          schoolClassId,
          sectionId,
          subjectIds,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
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
      });
  },
});

export const { resetSectionState } = sectionSlice.actions;
export default sectionSlice.reducer;
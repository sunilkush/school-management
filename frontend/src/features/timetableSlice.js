import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) => err?.response?.data?.message || fallback;
const normalizeData = (payload) => payload?.data || payload || [];

export const fetchTimetableMasterData = createAsyncThunk(
  "timetable/fetchMasterData",
  async ({ schoolId } = {}, { rejectWithValue }) => {
    try {
      console.log(schoolId)
      const paramsWithSchool = schoolId ? { schoolId } : {};
      const academicYearRequest = schoolId
        ? apiClient.get(`/academicYear/school/${schoolId}`)
        : Promise.resolve({ data: { data: [] } });
      const [classRes, sectionRes, subjectRes, teacherRes, academicYearRes] = await Promise.all([
        apiClient.get("/school-class/class-detailes", { params: paramsWithSchool }),
        apiClient.get("/sections", { params: paramsWithSchool }),
        apiClient.get("/subject/all", { params: { limit: 100 } }),
        apiClient.get("/employee", {
          params: {
            employeeType: "Teacher",
            isActive: true,
            ...paramsWithSchool,
          },
        }),
        academicYearRequest,
      ]);

      const academicYears = normalizeData(academicYearRes.data);
      const activeYear = academicYears.find((year) => year.isActive) || academicYears?.[0] || null;

      return {
        schoolClasses: normalizeData(classRes.data),
        sections: normalizeData(sectionRes.data),
        subjects: normalizeData(subjectRes.data),
        teachers: normalizeData(teacherRes.data),
        academicYears,
        activeAcademicYearId: activeYear?._id || "",
      };
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to load timetable master data"));
    }
  }
);

export const fetchClassTimetable = createAsyncThunk(
  "timetable/fetchClassTimetable",
  async ({ academicYearId, schoolClassId, sectionId, day } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (academicYearId) params.academicYearId = academicYearId;
      if (schoolClassId) params.schoolClassId = schoolClassId;
      if (sectionId) params.sectionId = sectionId;
      if (day) params.day = day;

      const res = await apiClient.get("/timetables/class", { params });
      return normalizeData(res.data);
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch class timetable"));
    }
  }
);

export const fetchTeacherTimetable = createAsyncThunk(
  "timetable/fetchTeacherTimetable",
  async ({ teacherId, day, academicYearId } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (teacherId) params.teacherId = teacherId;
      if (day) params.day = day;
      if (academicYearId) params.academicYearId = academicYearId;

      const res = await apiClient.get("/timetables/teacher", { params });
      return normalizeData(res.data);
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch teacher timetable"));
    }
  }
);

export const createTimetableEntry = createAsyncThunk(
  "timetable/createEntry",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/timetables", payload);
      return res.data?.data || null;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to create timetable entry"));
    }
  }
);

export const updateTimetableEntry = createAsyncThunk(
  "timetable/updateEntry",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/timetables/${id}`, payload);
      return res.data?.data || null;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to update timetable entry"));
    }
  }
);

export const deleteTimetableEntry = createAsyncThunk(
  "timetable/deleteEntry",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/timetables/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to delete timetable entry"));
    }
  }
);

const initialState = {
  schoolClasses: [],
  sections: [],
  subjects: [],
  teachers: [],
  academicYears: [],
  activeAcademicYearId: "",
  classTimetable: [],
  teacherTimetable: [],
  loading: false,
  saving: false,
  error: null,
};

const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    clearTimetableError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimetableMasterData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimetableMasterData.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolClasses = action.payload.schoolClasses;
        state.sections = action.payload.sections;
        state.subjects = action.payload.subjects;
        state.teachers = action.payload.teachers;
        state.academicYears = action.payload.academicYears;
        state.activeAcademicYearId = action.payload.activeAcademicYearId;
      })
      .addCase(fetchTimetableMasterData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      .addCase(fetchClassTimetable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.classTimetable = action.payload;
      })
      .addCase(fetchClassTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      .addCase(fetchTeacherTimetable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.teacherTimetable = action.payload;
      })
      .addCase(fetchTeacherTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      .addCase(createTimetableEntry.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createTimetableEntry.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTimetableEntry.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error?.message;
      })

      .addCase(updateTimetableEntry.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateTimetableEntry.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateTimetableEntry.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error?.message;
      })

      .addCase(deleteTimetableEntry.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteTimetableEntry.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteTimetableEntry.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { clearTimetableError } = timetableSlice.actions;
export default timetableSlice.reducer;

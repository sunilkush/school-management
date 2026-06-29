import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient.js";

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
const data = (response) => response?.data?.data ?? [];
const query = (params = {}) => ({
  params: Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  ),
});

export const fetchTimeSlots = createAsyncThunk(
  "timetable/fetchTimeSlots",
  async (params, { rejectWithValue }) => {
    try {
      return data(await apiClient.get("/timetable/time-slots", query(params)));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to fetch time slots"));
    }
  },
);
export const createTimeSlot = createAsyncThunk(
  "timetable/createTimeSlot",
  async (payload, { rejectWithValue }) => {
    try {
      return data(await apiClient.post("/timetable/time-slots", payload));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to create time slot"));
    }
  },
);
export const updateTimeSlot = createAsyncThunk(
  "timetable/updateTimeSlot",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return data(await apiClient.put(`/timetable/time-slots/${id}`, payload));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to update time slot"));
    }
  },
);
export const deleteTimeSlot = createAsyncThunk(
  "timetable/deleteTimeSlot",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/timetable/time-slots/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to delete time slot"));
    }
  },
);

export const fetchRooms = createAsyncThunk(
  "timetable/fetchRooms",
  async (params, { rejectWithValue }) => {
    try {
      return data(await apiClient.get("/timetable/rooms", query(params)));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to fetch rooms"));
    }
  },
);
export const createRoom = createAsyncThunk(
  "timetable/createRoom",
  async (payload, { rejectWithValue }) => {
    try {
      return data(await apiClient.post("/timetable/rooms", payload));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to create room"));
    }
  },
);
export const updateRoom = createAsyncThunk(
  "timetable/updateRoom",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return data(await apiClient.put(`/timetable/rooms/${id}`, payload));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to update room"));
    }
  },
);
export const deleteRoom = createAsyncThunk(
  "timetable/deleteRoom",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/timetable/rooms/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to delete room"));
    }
  },
);

export const fetchTimetable = createAsyncThunk(
  "timetable/fetchTimetable",
  async (params, { rejectWithValue }) => {
    try {
      return data(await apiClient.get("/timetable", query(params)));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to fetch timetable"));
    }
  },
);
export const createTimetableEntry = createAsyncThunk(
  "timetable/createTimetableEntry",
  async (payload, { rejectWithValue }) => {
    try {
      return data(await apiClient.post("/timetable", payload));
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to create timetable entry"),
      );
    }
  },
);
export const bulkSaveTimetable = createAsyncThunk(
  "timetable/bulkSaveTimetable",
  async (payload, { rejectWithValue }) => {
    try {
      return data(await apiClient.post("/timetable/bulk", payload));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to save timetable"));
    }
  },
);
export const updateTimetableEntry = createAsyncThunk(
  "timetable/updateTimetableEntry",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return data(await apiClient.put(`/timetable/${id}`, payload));
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to update timetable entry"),
      );
    }
  },
);
export const deleteTimetableEntry = createAsyncThunk(
  "timetable/deleteTimetableEntry",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/timetable/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to delete timetable entry"),
      );
    }
  },
);
export const copyWeekTimetable = createAsyncThunk(
  "timetable/copyWeekTimetable",
  async (payload, { rejectWithValue }) => {
    try {
      return data(await apiClient.post("/timetable/copy-week", payload));
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to copy timetable"));
    }
  },
);
export const fetchMyTeacherTimetable = createAsyncThunk(
  "timetable/fetchMyTeacherTimetable",
  async (params, { rejectWithValue }) => {
    try {
      return data(await apiClient.get("/timetable/teacher/my", query(params)));
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to fetch teacher timetable"),
      );
    }
  },
);
export const fetchMyStudentTimetable = createAsyncThunk(
  "timetable/fetchMyStudentTimetable",
  async (params, { rejectWithValue }) => {
    try {
      return data(await apiClient.get("/timetable/student/my", query(params)));
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to fetch student timetable"),
      );
    }
  },
);
export const fetchChildTimetable = createAsyncThunk(
  "timetable/fetchChildTimetable",
  async ({ studentId, ...params }, { rejectWithValue }) => {
    try {
      return data(
        await apiClient.get(
          `/timetable/parent/child/${studentId}`,
          query(params),
        ),
      );
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to fetch child timetable"),
      );
    }
  },
);

// Backward-compatible thunks retained for existing screens.
export const fetchClassTimetable = fetchTimetable;
export const fetchTeacherTimetable = fetchTimetable;
export const fetchTimetableMasterData = createAsyncThunk(
  "timetable/fetchMasterData",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        schoolId,
        academicYearId,
        parentId,
        includeRooms = false,
        includeClasses = true,
        includeSections = true,
        includeSubjects = true,
        includeTeachers = true,
        includeChildren = false,
      } = params;

      const requests = [
        [
          "timeSlots",
          apiClient.get(
            "/timetable/time-slots",
            query({ schoolId, academicYearId }),
          ),
        ],
      ];

      if (includeRooms)
        requests.push([
          "rooms",
          apiClient.get("/timetable/rooms", query({ schoolId })),
        ]);
      if (includeClasses)
        requests.push([
          "schoolClasses",
          apiClient.get(
            "/school-class/class-detailes",
            query({ schoolId, academicYearId }),
          ),
        ]);
      if (includeSections)
        requests.push([
          "sections",
          apiClient.get("/sections", query({ schoolId, academicYearId })),
        ]);
      if (includeSubjects)
        requests.push([
          "subjects",
          apiClient.get(
            "/subject/all",
            query({ schoolId, academicYearId, limit: 200 }),
          ),
        ]);
      if (includeTeachers)
        requests.push([
          "teachers",
          apiClient.get(
            "/user/all",
            query({ schoolId, roleName: "Teacher", isActive: true }),
          ),
        ]);
      if (includeChildren)
        requests.push([
          "children",
          apiClient.get("/student/my-children"),
        ]);

      const responses = await Promise.all(
        requests.map(([, request]) => request),
      );

      return requests.reduce(
        (acc, [key], index) => {
          acc[key] = data(responses[index]);
          return acc;
        },
        { academicYears: [], activeAcademicYearId: academicYearId || "" },
      );
    } catch (error) {
      return rejectWithValue(
        getError(error, "Failed to fetch timetable master data"),
      );
    }
  },
);

const initialState = {
  timeSlots: [],
  rooms: [],
  entries: [],
  myTeacherTimetable: [],
  myStudentTimetable: [],
  childTimetable: [],
  schoolClasses: [],
  sections: [],
  subjects: [],
  teachers: [],
  children: [],
  academicYears: [],
  activeAcademicYearId: "",
  classTimetable: [],
  teacherTimetable: [],
  loading: false,
  saving: false,
  error: null,
};

const slice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    clearTimetableError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.saving = false;
      state.error = action.payload || action.error?.message;
    };
    builder
      .addCase(fetchTimeSlots.pending, pending)
      .addCase(fetchTimeSlots.fulfilled, (s, a) => {
        s.loading = false;
        s.timeSlots = a.payload;
      })
      .addCase(fetchTimeSlots.rejected, rejected)
      .addCase(fetchRooms.pending, pending)
      .addCase(fetchRooms.fulfilled, (s, a) => {
        s.loading = false;
        s.rooms = a.payload;
      })
      .addCase(fetchRooms.rejected, rejected)
      .addCase(fetchTimetable.pending, pending)
      .addCase(fetchTimetable.fulfilled, (s, a) => {
        s.loading = false;
        s.entries = a.payload;
        s.classTimetable = a.payload;
        s.teacherTimetable = a.payload;
      })
      .addCase(fetchTimetable.rejected, rejected)
      .addCase(fetchMyTeacherTimetable.pending, pending)
      .addCase(fetchMyTeacherTimetable.fulfilled, (s, a) => {
        s.loading = false;
        s.myTeacherTimetable = a.payload;
        s.teacherTimetable = a.payload;
      })
      .addCase(fetchMyTeacherTimetable.rejected, rejected)
      .addCase(fetchMyStudentTimetable.pending, pending)
      .addCase(fetchMyStudentTimetable.fulfilled, (s, a) => {
        s.loading = false;
        s.myStudentTimetable = a.payload;
      })
      .addCase(fetchMyStudentTimetable.rejected, rejected)
      .addCase(fetchChildTimetable.pending, pending)
      .addCase(fetchChildTimetable.fulfilled, (s, a) => {
        s.loading = false;
        s.childTimetable = a.payload;
      })
      .addCase(fetchChildTimetable.rejected, rejected)
      .addCase(fetchTimetableMasterData.pending, pending)
      .addCase(fetchTimetableMasterData.fulfilled, (s, a) => {
        s.loading = false;
        Object.entries(a.payload || {}).forEach(([key, value]) => {
          if (key in s) s[key] = value;
        });
      })
      .addCase(fetchTimetableMasterData.rejected, rejected)
      .addCase(createTimeSlot.fulfilled, (s, a) => {
        s.timeSlots.push(a.payload);
      })
      .addCase(updateTimeSlot.fulfilled, (s, a) => {
        s.timeSlots = s.timeSlots.map((x) =>
          x._id === a.payload._id ? a.payload : x,
        );
      })
      .addCase(deleteTimeSlot.fulfilled, (s, a) => {
        s.timeSlots = s.timeSlots.filter((x) => x._id !== a.payload);
      })
      .addCase(createRoom.fulfilled, (s, a) => {
        s.rooms.push(a.payload);
      })
      .addCase(updateRoom.fulfilled, (s, a) => {
        s.rooms = s.rooms.map((x) => (x._id === a.payload._id ? a.payload : x));
      })
      .addCase(deleteRoom.fulfilled, (s, a) => {
        s.rooms = s.rooms.filter((x) => x._id !== a.payload);
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("timetable/") &&
          action.type.endsWith("/pending"),
        (s) => {
          s.saving = true;
          s.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("timetable/") &&
          action.type.endsWith("/fulfilled"),
        (s) => {
          s.saving = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("timetable/") &&
          action.type.endsWith("/rejected"),
        rejected,
      );
  },
});

export const { clearTimetableError } = slice.actions;
export default slice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";
import { toast } from "react-toastify";


// fetch last student
export const fetchLastRegisteredStudent = createAsyncThunk(
  "students/fetchLastRegisteredStudent",
  async ({ schoolId, academicYearId }, { rejectWithValue }) => {
    try {
    

      const response = await apiClient.get(
        `/student/last-registered`,
        {
          params: { schoolId, academicYearId },
         
        }
      );
    
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch last registered student"
      );
    }
  }
);

// create student
export const createStudent = createAsyncThunk(
  "student/addStudent",
  async (studentData, { rejectWithValue }) => {
    try {
      

      const response = await apiClient.post(
        `/student/register`,
        studentData, // plain object
       
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const bulkImportStudents = createAsyncThunk(
  "student/bulkImport",
  async ({ schoolId, academicYearId, rows }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/student/bulk-import", { schoolId, academicYearId, rows });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Bulk import failed");
    }
  }
);

export const transferStudent = createAsyncThunk(
  "student/transfer",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/student/transfer", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Transfer failed");
    }
  }
);

// fetch all students
export const fetchAllStudent = createAsyncThunk(
  "student/fetchAllStudent",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ Choose URL based on schoolId presence
      const url = `/student/all`;

      // ✅ Fetch data
      const res = await apiClient.get(url);

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch students"
      );
    }
  }
);

export const fetchAllStudentByRole = createAsyncThunk(
  "student/fetchAllStudentByRole",
  async ({ schoolId, academicYearId, schoolClassId, page = 1, limit = 500 }, { rejectWithValue }) => {
    try {
      // ✅ Choose URL based on schoolId presence
      const url = `/student/by-role`;

      // ✅ Fetch data
      const res = await apiClient.get(url, {
        params: { schoolId, academicYearId, schoolClassId, page, limit },
      });

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch students"
      );
    }
  }
);
export const fetchStudentsBySchoolId = createAsyncThunk(
  "student/fetchBySchoolId",
  async ({ schoolId, academicYearId, schoolClassId, sectionId, page, limit }, { rejectWithValue }) => {
    try {
      // ✅ check valid schoolId
      if (!schoolId) {
        return rejectWithValue("schoolId is required");
      }


      // ✅ API Call
      const res = await apiClient.get(`/student/school`, {

        params: {
          schoolId,
          academicYearId,
          schoolClassId,
          sectionId,
          page,limit
        },
      });
       
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch students by school"
      );
    }
  }
);

export const updateStudent = createAsyncThunk(
  "student/updateStudent",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/student/update/${id}`, data);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update student"
      );
    }
  }
);

export const deleteStudent = createAsyncThunk(
  "student/deleteStudent",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/student/delete/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete student"
      );
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  "student/fetchStudentById",
  async (userId, { rejectWithValue }) => {
    try {
      

      const res = await apiClient.get(`/student/getStudent/${userId}`, {
        headers: {
        },
      });

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch student by ID"
      );
    }
  }
);


export const fetchMyStudentEnrollment = createAsyncThunk(
  "student/fetchMyStudentEnrollment",
  async (_, { rejectWithValue }) => {
    try {
      

      const res = await apiClient.get(
        `/student/my/enrollment-id`,
        {
          headers: {
          },
        }
      );

      return res.data.data; // { enrollmentId, studentId, schoolClassId, sectionId }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch student enrollment"
      );
    }
  }
);

/* ── Roll Number Thunks ──────────────────────────────────── */
export const fetchClassRollNumbers = createAsyncThunk(
  "students/fetchClassRollNumbers",
  async ({ schoolId, academicYearId, schoolClassId, sectionId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student/roll-numbers", {
        params: { schoolId, academicYearId, schoolClassId, sectionId },
      });
      return res.data.data?.students || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch roll numbers");
    }
  }
);

export const updateRollNumber = createAsyncThunk(
  "students/updateRollNumber",
  async ({ enrollmentId, rollNumber }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/student/roll-number/${enrollmentId}`, { rollNumber });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update roll number");
    }
  }
);

export const autoAssignRollNumbers = createAsyncThunk(
  "students/autoAssignRollNumbers",
  async ({ schoolId, academicYearId, schoolClassId, sectionId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/student/roll-numbers/auto-assign", {
        schoolId, academicYearId, schoolClassId, sectionId,
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to auto-assign roll numbers");
    }
  }
);

const initialState = {
  lastStudent: null, // last stide
  student: null, // single student
  studentList: [], // list of students
  schoolStudents: [],
  schoolStudentsPagination: null, // { total, page, limit } from the last fetchStudentsBySchoolId call
  bulkImportLoading: false,
  bulkImportResult: null, // { created: [...], errors: [...] } from the last bulkImportStudents call
  rollNumberList: [],   // students with roll numbers for a class-section
  loading: false,
  rollLoading: false,
  error: null,
  success: false,
  registrationNumber: "",
   myEnrollment: null,
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    clearStudentState: (state) => {
      state.loading = false;
      state.error = null;
      state.lastStudent = null;
      state.registrationNumber = "";
    },
    clearBulkImportResult: (state) => {
      state.bulkImportResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch last student
      // Pending
      .addCase(fetchLastRegisteredStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Fulfilled
      .addCase(fetchLastRegisteredStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastStudent = action.payload.lastStudent;
        state.registrationNumber = action.payload.registrationNumber;
      })
      // Rejected
      .addCase(fetchLastRegisteredStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create student
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.student = action.payload;
        state.success = true;
        toast.success("Student created successfully");
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(state.error || "Failed to create student");
      })

      // bulk import students
      .addCase(bulkImportStudents.pending, (state) => {
        state.bulkImportLoading = true;
        state.bulkImportResult = null;
      })
      .addCase(bulkImportStudents.fulfilled, (state, action) => {
        state.bulkImportLoading = false;
        state.bulkImportResult = action.payload;
        const created = action.payload?.created?.length || 0;
        const errors = action.payload?.errors?.length || 0;
        if (created && !errors) toast.success(`Imported ${created} students successfully`);
        else if (created) toast.success(`Imported ${created} students — ${errors} rows had errors`);
        else toast.error(`Import failed for all ${errors} rows`);
      })
      .addCase(bulkImportStudents.rejected, (state, action) => {
        state.bulkImportLoading = false;
        toast.error(action.payload || "Bulk import failed");
      })

      // transfer student
      .addCase(transferStudent.fulfilled, (state, action) => {
        const schoolName = action.payload?.targetSchool?.name;
        toast.success(schoolName ? `Student transferred to ${schoolName}` : "Student transferred successfully");
      })
      .addCase(transferStudent.rejected, (state, action) => {
        toast.error(action.payload || "Transfer failed");
      })

      // fetch all students
      .addCase(fetchAllStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchAllStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.studentList = action.payload.data?.students || [];
        state.success = true;
      })
      .addCase(fetchAllStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // fetch all students by role
        .addCase(fetchAllStudentByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      }
      )
      .addCase(fetchAllStudentByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.studentList = action.payload.data?.students || [];
        state.success = true;
      }
      )
      .addCase(fetchAllStudentByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      } )
      .addCase(fetchStudentsBySchoolId.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchStudentsBySchoolId.fulfilled, (state, action) => {
        state.loading = false;
         state.schoolStudents =
          action.payload?.data?.students ||
          action.payload?.data ||
          action.payload ||
          [];
        // The backend already computes a real total via $facet — without this, callers have no
        // way to drive server-side pagination and fall back to fetching everything at once.
        state.schoolStudentsPagination = action.payload?.pagination || null;
        state.success = true;
      })
      .addCase(fetchStudentsBySchoolId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      .addCase(updateStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudent.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolStudents = (Array.isArray(state.schoolStudents) ? state.schoolStudents : []).filter(
          (s) => s.studentId !== action.payload && s._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.loading = false;
        state.student = action.payload || null;
        state.success = true;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      .addCase(fetchMyStudentEnrollment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStudentEnrollment.fulfilled, (state, action) => {
        state.loading = false;
        state.myEnrollment = action.payload;
      })
      .addCase(fetchMyStudentEnrollment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Roll number management
      .addCase(fetchClassRollNumbers.pending, (state) => {
        state.rollLoading = true;
        state.error = null;
      })
      .addCase(fetchClassRollNumbers.fulfilled, (state, action) => {
        state.rollLoading = false;
        state.rollNumberList = action.payload;
      })
      .addCase(fetchClassRollNumbers.rejected, (state, action) => {
        state.rollLoading = false;
        state.error = action.payload;
      })
      .addCase(updateRollNumber.fulfilled, (state, action) => {
        const { enrollmentId, rollNumber } = action.payload;
        state.rollNumberList = state.rollNumberList.map((s) =>
          s._id === enrollmentId ? { ...s, rollNumber } : s
        );
      })
      .addCase(autoAssignRollNumbers.pending, (state) => {
        state.rollLoading = true;
      })
      .addCase(autoAssignRollNumbers.fulfilled, (state, action) => {
        state.rollLoading = false;
        // Merge new roll numbers into the list
        const updated = action.payload?.students || [];
        const map = {};
        updated.forEach((s) => { map[s.enrollmentId] = s.rollNumber; });
        state.rollNumberList = state.rollNumberList.map((s) =>
          map[s._id] !== undefined ? { ...s, rollNumber: map[s._id] } : s
        );
      })
      .addCase(autoAssignRollNumbers.rejected, (state, action) => {
        state.rollLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStudentState, clearBulkImportResult } = studentSlice.actions;
export default studentSlice.reducer;

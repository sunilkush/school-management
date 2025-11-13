import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// fetch last student
export const fetchLastRegisteredStudent = createAsyncThunk(
  "students/fetchLastRegisteredStudent",
  async ({ schoolId, academicYearId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const response = await axios.get(
        `${Api_Base_Url}/student/last-registered`,
        {
          params: { schoolId, academicYearId },
          headers: {
            Authorization: `Bearer ${token}`, // ✅ add this line
          },
        }
      );
      console.log("Last registered student response:", response.data.data);
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
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const response = await axios.post(
        `${Api_Base_Url}/student/register`,
        studentData, // plain object
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// fetch all students
export const fetchAllStudent = createAsyncThunk(
  "student/fetchAllStudent",
  async ({ schoolId, academicYearId, classId } = {}, { rejectWithValue }) => {
    try {
    
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      // ✅ Choose URL based on schoolId presence
      const url = `${Api_Base_Url}/student/all`;

      // ✅ Fetch data
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: { schoolId, academicYearId, classId },
      });

      return res.data;
    } catch (error) {
      
      return rejectWithValue(error.response?.data?.message || "Failed to fetch students");
    }
  }
);

export const fetchStudentsBySchoolId = createAsyncThunk(
  "student/fetchBySchoolId",
  async ({ schoolId, academicYearId }, { rejectWithValue }) => {
    try {
      console.log("Fetching students for schoolId:", schoolId, "academicYearId:", academicYearId);

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${Api_Base_Url}/student/${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          academicYearId, // ✅ send academicYearId as query param
        },
      });
      return res.data.data;
    } catch (error) {
     
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch students by school ID"
      );
    }
  }
);

const initialState = {
  lastStudent: null, // last stide
  student: null,   // single student
  studentList: [],    // list of students
  schoolStudents: [],
  loading: false,
  error: null,
  success: false,
  registrationNumber: "",
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

      // fetch all students
      .addCase(fetchAllStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchAllStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.studentList = action.payload.data?.students || []
        state.success = true;
      })
      .addCase(fetchAllStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      .addCase(fetchStudentsBySchoolId.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchStudentsBySchoolId.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolStudents = action.payload || [];
        state.success = true;
      })
      .addCase(fetchStudentsBySchoolId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

  },
});

export const { clearStudentState } = studentSlice.actions;
export default studentSlice.reducer;

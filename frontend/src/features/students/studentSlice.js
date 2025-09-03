import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// fetch last student
export const fetchLastStudent = createAsyncThunk(
  "student/fetchLastStudent",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${Api_Base_Url}/student/register/last`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
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
  async ({ schoolId, academicYearId,classId } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${Api_Base_Url}/student/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params:{schoolId, academicYearId,classId }
      });
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  lastStudent: null,
  student: null,   // single student
  studentList: [],    // list of students
  loading: false,
  error: null,
  success: false,
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    resetStudentState: (state) => {
      state.student = null;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch last student
      .addCase(fetchLastStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLastStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.lastStudent = action.payload;
      })
      .addCase(fetchLastStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch last student";
        toast.error(state.error);
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
      });
  },
});

export const { resetStudentState } = studentSlice.actions;
export default studentSlice.reducer;

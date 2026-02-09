import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// CREATE class
export const createClass = createAsyncThunk(
  "class/createClass",
  async (classData, { rejectWithValue }) => {
    try {
     
      console.log("Creating class with data:", classData);
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/class/create`, classData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Class created:", res.data);
      return res.data?.data || res.data; // safe return
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class creation failed!"
      );
    }
  }
);

export const fetchAllClasses = createAsyncThunk(
  "class/fetchAllClasses",
  async (payload, { rejectWithValue, signal }) => {
    try {
      const { schoolId, academicYearId } = payload || {}; // ✅ safe destructuring
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(`${Api_Base_Url}/class/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { schoolId, academicYearId },
        signal, // ✅ axios v1+ supports signal (for cancellation)
      });
     
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch classes");
    }
  }
);


// DELETE class
export const deleteClass = createAsyncThunk(
  "class/deleteClass",
  async (classId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${Api_Base_Url}/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return classId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class deletion failed!"
      );
    }
  }
);

// UPDATE class
export const updateClass = createAsyncThunk(
  "class/updateClass",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${Api_Base_Url}/class/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

     
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class update failed!"
      );
    }
  }
);

export const assignsubjects = createAsyncThunk(
  "class/assignsubjects",
      async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/class/assign-subjects`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Assigning subjects failed!"
      );
    }});


export const fetchAssignedClasses = createAsyncThunk(
  "class/fetchAssignedClasses",
  async (paramsData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(
        `${Api_Base_Url}/class/assign-teacher`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: paramsData,
        }
      );
     
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
        "Fetching assigned classes failed!"
      );
    }
  }
);



const classSlice = createSlice({
  name: "class",
  initialState: {
    loading: false,
    error: null,
    classList: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    success: false,
    classAssignTeacher:[]
  },
  reducers: {
    resetClassState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllClasses.fulfilled, (state, action) => {
        state.loading = false;

        // backend se pura object aata hai
        state.classList = action.payload?.data?.data || [];
        state.total = action.payload?.data?.total || 0;
        state.page = action.payload?.data?.page || 1;
        state.limit = action.payload?.data?.limit || 10;
        state.totalPages = action.payload?.data?.totalPages || 0;
      })
      .addCase(fetchAllClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.classList.push(action.payload);
        }
        state.success = true;
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classList = state.classList.filter(
          (cls) => cls._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        console.log(updated)
        state.classList = state.classList.map((cls) =>
          cls._id === updated._id ? updated : cls
        );
        state.success = true;
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //class assign teacher
      .addCase(fetchAssignedClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedClasses.fulfilled, (state, action) => {
          state.loading = false;
          state.classAssignTeacher = action.payload || [];
        })
      .addCase(fetchAssignedClasses.rejected, (state, action) => {
           state.loading = false;
           state.error = action.payload;
      })
  },
});

export const { resetClassState } = classSlice.actions;
export default classSlice.reducer;

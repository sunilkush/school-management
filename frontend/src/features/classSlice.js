import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

// ================= CREATE =================
export const createClass = createAsyncThunk(
  "class/createClass",
  async (classData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/class`, classData);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class creation failed!"
      );
    }
  }
);

// ================= FETCH =================
export const fetchAllClasses = createAsyncThunk(
  "class/fetchAllClasses",
  async (_, { rejectWithValue}) => {
    try {
     

      const res = await apiClient.get(`/class`);

      return res.data; // ✅ full response
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch classes"
      );
    }
  }
);

// ================= DELETE =================
export const deleteClass = createAsyncThunk(
  "class/deleteClass",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/class/${id}`);
      return id; // ✅ always return id
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class deletion failed!"
      );
    }
  }
);

// ================= UPDATE =================
export const updateClass = createAsyncThunk(
  "class/updateClass",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/class/${id}`, data);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class update failed!"
      );
    }
  }
);

// ================= ASSIGN SUBJECTS =================
export const assignSubjects = createAsyncThunk(
  "class/assignSubjects",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/class/assign-subjects`, data);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Assign subjects failed!"
      );
    }
  }
);

// ================= FETCH ASSIGNED =================
export const fetchAssignedClasses = createAsyncThunk(
  "class/fetchAssignedClasses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/class/assign-teacher`, {
        params,
      });
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          "Fetching assigned classes failed!"
      );
    }
  }
);

// ================= SLICE =================
const classSlice = createSlice({
  name: "class",
  initialState: {
    loading: false,
    error: null,
    classList: [],
    success: false,
    classAssignTeacher: [],
  },
  reducers: {
    resetClassState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchAllClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classList =  action.payload.data || [];
      
      })
      .addCase(fetchAllClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.classList.unshift(action.payload);
        }
        state.success = true;
      })

      // DELETE
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classList = state.classList.filter(
          (cls) => cls._id !== action.payload
        );
        state.success = true;
      })

      // UPDATE
      .addCase(updateClass.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload;
        if (!updated) return;

        const index = state.classList.findIndex(
          (c) => c._id === updated._id
        );

        if (index !== -1) {
          state.classList[index] = updated;
        }

        state.success = true;
      })

      // ASSIGNED TEACHERS
      .addCase(fetchAssignedClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classAssignTeacher = action.payload;
      });
  },
});

export const { resetClassState } = classSlice.actions;
export default classSlice.reducer;
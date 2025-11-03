import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// ==========================================================
// ✅ Create Subject (Super Admin or School Admin)
// ==========================================================
export const createSubject = createAsyncThunk(
  "subject/createSubject",
  async (subjectData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/subject/create`, subjectData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Subject creation failed!"
      );
    }
  }
);

// ==========================================================
// ✅ Fetch All Subjects (Role-based + Pagination + Search)
// ==========================================================
export const fetchAllSubjects = createAsyncThunk(
  "subject/fetchAllSubjects",
  async (
    { page = 1, limit = 10, schoolId, search = "", isGlobal } = {},
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${Api_Base_Url}/subject/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, schoolId, search, isGlobal },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch subjects!"
      );
    }
  }
);

// ==========================================================
// ✅ Update Subject
// ==========================================================
export const updateSubject = createAsyncThunk(
  "subject/updateSubject",
  async ({ subjectId, subjectData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${Api_Base_Url}/subject/${subjectId}`, subjectData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Subject update failed!"
      );
    }
  }
);

// ==========================================================
// ✅ Assign Schools to Subject (New Route Fixed)
// ==========================================================
export const assignSchoolsToSubject = createAsyncThunk(
  "subject/assignSchoolsToSubject",
  async ({ subjectId, schoolIds }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${Api_Base_Url}/subject/assign/${subjectId}`,
        { schoolIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to assign schools to subject!"
      );
    }
  }
);

// ==========================================================
// ✅ Delete Subject
// ==========================================================
export const deleteSubject = createAsyncThunk(
  "subject/deleteSubject",
  async (subjectId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.delete(`${Api_Base_Url}/subject/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete subject!"
      );
    }
  }
);

// ==========================================================
// 🧩 Initial State
// ==========================================================
const initialState = {
  loading: false,
  error: null,
  subjectList: [],
  pagination: { total: 0, page: 1, totalPages: 1 },
  success: false,
  successMessage: null,
};

// ==========================================================
// ⚙️ Slice Definition
// ==========================================================
const subjectSlice = createSlice({
  name: "subject",
  initialState,
  reducers: {
    clearSubjectMessages: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Create
      .addCase(createSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSubject.fulfilled, (state, action) => {
        state.loading = false;
        const newSubject = action.payload?.data;
        if (newSubject) state.subjectList.unshift(newSubject);
        state.success = true;
        state.successMessage =
          action.payload?.message || "Subject created successfully!";
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch All
      .addCase(fetchAllSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjectList = action.payload?.data?.subjects || [];
        state.pagination =
          action.payload?.data?.pagination || {
            total: 0,
            page: 1,
            totalPages: 1,
          };
        state.success = true;
      })
      .addCase(fetchAllSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Update
      .addCase(updateSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubject.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.subjectList.findIndex((s) => s._id === updated._id);
          if (index !== -1) state.subjectList[index] = updated;
        }
        state.loading = false;
        state.success = true;
        state.successMessage = "Subject updated successfully!";
      })
      .addCase(updateSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Assign Schools
      .addCase(assignSchoolsToSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignSchoolsToSubject.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.successMessage =
          action.payload?.message || "Schools assigned successfully!";
      })
      .addCase(assignSchoolsToSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Delete
      .addCase(deleteSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubject.fulfilled, (state, action) => {
        const deletedId = action.payload?.data?._id;
        if (deletedId) {
          state.subjectList = state.subjectList.filter(
            (s) => s._id !== deletedId
          );
        }
        state.loading = false;
        state.success = true;
        state.successMessage =
          action.payload?.message || "Subject deleted successfully!";
      })
      .addCase(deleteSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSubjectMessages } = subjectSlice.actions;
export default subjectSlice.reducer;

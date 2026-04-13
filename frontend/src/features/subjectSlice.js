import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const normalizeSubjectId = (subjectId) => {
  if (!subjectId) return "";
  if (typeof subjectId === "string") return subjectId;
  return subjectId?._id || subjectId?.id || "";
};

// ==========================================================
// ✅ Create Subject
// ==========================================================
export const createSubject = createAsyncThunk(
  "subject/createSubject",
  async (subjectData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/subject/create`, subjectData, {      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Subject creation failed!"
      );
    }
  }
);

// ==========================================================
// ✅ Fetch All Subjects
// ==========================================================
export const getAllSubjects = createAsyncThunk(
  "subject/getAllSubjects",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 100,
        search = "",
          isGlobal,
        schoolId,
        academicYearId,
        ...restParams
      } = params;

      const res = await apiClient.get(`/subject/all`, {
         params: {
          page,
          limit,
          search,
          isGlobal,
          schoolId,
          academicYearId,
          ...restParams,
        },
      });
      
      return res.data; // ✅ return full response
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
     const validSubjectId = normalizeSubjectId(subjectId);
      if (!validSubjectId) {
        return rejectWithValue("Invalid subject ID");
      }

      const res = await apiClient.put(
        `/subject/${validSubjectId}/assign-teachers`,
        subjectData,
        {}
      );
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Subject update failed!"
      );
    }
  }
);

// ==========================================================
// ✅ Assign Schools to Subject
// ==========================================================
export const assignSchoolsToSubject = createAsyncThunk(
  "subject/assignSchoolsToSubject",
  async ({ subjectId, schoolIds }, { rejectWithValue }) => {
    try {
        const validSubjectId = normalizeSubjectId(subjectId);
      if (!validSubjectId) {
        return rejectWithValue("Invalid subject ID");
      }
      const res = await apiClient.put(
        `/subject/assign-schools/${validSubjectId}`,
        { schoolIds },
        {}
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
       const validSubjectId = normalizeSubjectId(subjectId);
      if (!validSubjectId) {
        return rejectWithValue("Invalid subject ID");
      }

      const res = await apiClient.delete(`/subject/${validSubjectId}`, {});
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
  subjects: [], // ✅ unified key for subject data
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
      state.success = false;
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
        if (newSubject) state.subjects.unshift(newSubject);
        state.success = true;
        state.successMessage =
          action.payload?.message || "Subject created successfully!";
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch All
      .addCase(getAllSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
    .addCase(getAllSubjects.fulfilled, (state, action) => {
          state.loading = false;

          const payload = action.payload || {};

          state.subjects = payload?.data || [];

          state.pagination = {
            total: payload.total || 0,
            page: payload.page || 1,
            totalPages: payload.totalPages || 1,
          };
        })
      .addCase(getAllSubjects.rejected, (state, action) => {
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
          const index = state.subjects.findIndex((s) => s._id === updated._id);
          if (index !== -1) state.subjects[index] = updated;
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
        const deletedId =
          action.payload?.data?._id || action.meta.arg;

        state.subjects = state.subjects.filter(
          (s) => s._id !== deletedId
        );

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

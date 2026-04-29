import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchPromotionAcademicYears = createAsyncThunk(
  "studentPromotion/fetchAcademicYears",
 async (_, { rejectWithValue, getState }) => {
    try {
      const schoolId = getState()?.auth?.user?.school?._id;
      if (!schoolId) return rejectWithValue("School not found for current user");

      const res = await apiClient.get(`/academicYear/school/${schoolId}`);
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load academic years");
    }
  }
);

export const fetchPromotionClasses = createAsyncThunk(
  "studentPromotion/fetchClasses",
  async ({ academicYearId,schoolId, mode }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/school-class", { params: { academicYearId , schoolId } });
      return { mode, classes: res.data?.data || [] };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load classes");
    }
  }
);

export const fetchPromotionSections = createAsyncThunk(
  "studentPromotion/fetchSections",
  async ({ schoolClassId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/sections", { params: { schoolClassId } });
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load sections");
    }
  }
);

export const fetchPromotionCandidates = createAsyncThunk(
  "studentPromotion/fetchCandidates",
  async ({ schoolClassId, academicYearId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/student/promotion/candidates", {
        params: { schoolClassId, academicYearId },
      });
      return res.data?.data?.students || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load students");
    }
  }
);

export const promoteStudents = createAsyncThunk(
  "studentPromotion/promoteStudents",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/student/promotion/promote", payload);
      return res.data?.data || {};
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to promote students");
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  promoting: false,
  academicYears: [],
  sourceClasses: [],
  targetClasses: [],
  sections: [],
  candidates: [],
  lastPromotionResult: null,
};

const studentPromotionSlice = createSlice({
  name: "studentPromotion",
  initialState,
  reducers: {
    clearPromotionError: (state) => {
      state.error = null;
    },
    clearPromotionResult: (state) => {
      state.lastPromotionResult = null;
    },
    clearPromotionCandidates: (state) => {
      state.candidates = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotionAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })
      .addCase(fetchPromotionAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPromotionClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionClasses.fulfilled, (state, action) => {
        state.loading = false;
        const { mode, classes } = action.payload || {};
        if (mode === "target") state.targetClasses = classes || [];
        else state.sourceClasses = classes || [];
      })
      .addCase(fetchPromotionClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPromotionSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionSections.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = action.payload || [];
      })
      .addCase(fetchPromotionSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPromotionCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload || [];
      })
      .addCase(fetchPromotionCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(promoteStudents.pending, (state) => {
        state.promoting = true;
        state.error = null;
      })
      .addCase(promoteStudents.fulfilled, (state, action) => {
        state.promoting = false;
        state.lastPromotionResult = action.payload;
      })
      .addCase(promoteStudents.rejected, (state, action) => {
        state.promoting = false;
        state.error = action.payload;
      });
  },
});

export const { clearPromotionError, clearPromotionResult, clearPromotionCandidates } =
  studentPromotionSlice.actions;
export default studentPromotionSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * UDISE+ / APAAR / PEN / RTE record-keeping.
 *
 * Nothing here files anything with a government system — there is no UDISE+ API. It holds the
 * identifiers, and works out which records are not yet ready to be filed.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`compliance/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchSchoolCompliance = thunk(
  "fetchSchool",
  () => apiClient.get("/compliance/school"),
  "Failed to load the school details"
);

export const saveSchoolCompliance = thunk(
  "saveSchool",
  (payload) => apiClient.put("/compliance/school", payload),
  "Failed to save the school details"
);

export const fetchStudentCompliance = thunk(
  "fetchStudents",
  (params = {}) => apiClient.get("/compliance/students", { params }),
  "Failed to load the student records"
);

export const saveStudentCompliance = thunk(
  "saveStudent",
  ({ id, ...payload }) => apiClient.patch(`/compliance/students/${id}`, payload),
  "Failed to save the student record"
);

export const bulkSaveStudentCompliance = thunk(
  "bulkSave",
  (rows) => apiClient.patch("/compliance/students/bulk", { rows }),
  "Failed to save the records"
);

export const fetchReadiness = thunk(
  "fetchReadiness",
  (params = {}) => apiClient.get("/compliance/readiness", { params }),
  "Failed to load the readiness report"
);

export const fetchRte = thunk(
  "fetchRte",
  (params = {}) => apiClient.get("/compliance/rte", { params }),
  "Failed to load the RTE position"
);

export const fetchComplianceExport = thunk(
  "fetchExport",
  (params = {}) => apiClient.get("/compliance/export", { params }),
  "Failed to build the export"
);

const initialState = {
  school: null,
  schoolLoading: false,
  students: [],
  studentsLoading: false,
  readiness: null,
  readinessLoading: false,
  rte: null,
  rteLoading: false,
  actionLoading: false,
  error: null,
};

const complianceSlice = createSlice({
  name: "compliance",
  initialState,
  extraReducers: (builder) => {
    const loadInto = (t, key, loadingKey) => {
      builder
        .addCase(t.pending, (state) => { state[loadingKey] = true; state.error = null; })
        .addCase(t.fulfilled, (state, action) => {
          state[loadingKey] = false;
          state[key] = action.payload ?? initialState[key];
        })
        .addCase(t.rejected, (state, action) => { state[loadingKey] = false; state.error = action.payload; });
    };

    loadInto(fetchSchoolCompliance, "school", "schoolLoading");
    loadInto(fetchStudentCompliance, "students", "studentsLoading");
    loadInto(fetchReadiness, "readiness", "readinessLoading");
    loadInto(fetchRte, "rte", "rteLoading");

    [saveSchoolCompliance, saveStudentCompliance, bulkSaveStudentCompliance, fetchComplianceExport].forEach((t) => {
      builder
        .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
        .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
        .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
    });
  },
});

export default complianceSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Recruitment and staff appraisal — two halves of the same job, run by the same small group of
 * people at a school, so they share a slice.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`hr/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

/* ── Recruitment ── */
export const fetchPostings = thunk("fetchPostings", (params = {}) => apiClient.get("/hr/postings", { params }), "Failed to load the vacancies");
export const createPosting = thunk("createPosting", (payload) => apiClient.post("/hr/postings", payload), "Failed to create the vacancy");
export const updatePosting = thunk("updatePosting", ({ id, ...payload }) => apiClient.patch(`/hr/postings/${id}`, payload), "Failed to update the vacancy");
export const deletePosting = thunk("deletePosting", (id) => apiClient.delete(`/hr/postings/${id}`), "Failed to delete the vacancy");
export const fetchPipeline = thunk("fetchPipeline", (params = {}) => apiClient.get("/hr/postings/pipeline", { params }), "Failed to load the pipeline");

export const fetchApplications = thunk("fetchApplications", (params = {}) => apiClient.get("/hr/applications", { params }), "Failed to load the applications");
export const createApplication = thunk("createApplication", (payload) => apiClient.post("/hr/applications", payload), "Failed to record the application");
export const moveApplication = thunk("moveApplication", ({ id, ...payload }) => apiClient.patch(`/hr/applications/${id}/stage`, payload), "Failed to move the candidate");
export const reopenApplication = thunk("reopenApplication", ({ id, note }) => apiClient.patch(`/hr/applications/${id}/reopen`, { note }), "Failed to reopen the application");

/* ── Appraisal ── */
export const fetchCycles = thunk("fetchCycles", () => apiClient.get("/hr/appraisal/cycles"), "Failed to load the appraisal cycles");
export const createCycle = thunk("createCycle", (payload) => apiClient.post("/hr/appraisal/cycles", payload), "Failed to create the cycle");
export const updateCycle = thunk("updateCycle", ({ id, ...payload }) => apiClient.patch(`/hr/appraisal/cycles/${id}`, payload), "Failed to update the cycle");
export const startCycle = thunk("startCycle", ({ id, reviewerId }) => apiClient.post(`/hr/appraisal/cycles/${id}/start`, { reviewerId }), "Failed to start the reviews");

export const fetchReviews = thunk("fetchReviews", (params = {}) => apiClient.get("/hr/appraisal/reviews", { params }), "Failed to load the reviews");
export const fetchReview = thunk("fetchReview", (id) => apiClient.get(`/hr/appraisal/reviews/${id}`), "Failed to load the review");
export const fetchMyReview = thunk("fetchMyReview", (params = {}) => apiClient.get("/hr/appraisal/reviews/mine", { params }), "Failed to load your appraisal");
export const submitSelfAssessment = thunk("submitSelf", ({ id, ...payload }) => apiClient.patch(`/hr/appraisal/reviews/${id}/self`, payload), "Failed to submit your self-assessment");
export const submitReview = thunk("submitReview", ({ id, ...payload }) => apiClient.patch(`/hr/appraisal/reviews/${id}/review`, payload), "Failed to save the review");

const initialState = {
  postings: [],
  postingsLoading: false,
  pipeline: null,
  applications: [],
  applicationsLoading: false,
  cycles: [],
  cyclesLoading: false,
  reviews: [],
  reviewsLoading: false,
  review: null,
  myReview: null,
  myReviewLoading: false,
  actionLoading: false,
  error: null,
};

const hrSlice = createSlice({
  name: "hr",
  initialState,
  reducers: {
    clearReview: (state) => { state.review = null; },
  },
  extraReducers: (builder) => {
    const loadInto = (t, key, loadingKey) => {
      builder
        .addCase(t.pending, (state) => { if (loadingKey) state[loadingKey] = true; state.error = null; })
        .addCase(t.fulfilled, (state, action) => {
          if (loadingKey) state[loadingKey] = false;
          state[key] = action.payload ?? initialState[key];
        })
        .addCase(t.rejected, (state, action) => { if (loadingKey) state[loadingKey] = false; state.error = action.payload; });
    };

    loadInto(fetchPostings, "postings", "postingsLoading");
    loadInto(fetchPipeline, "pipeline", null);
    loadInto(fetchApplications, "applications", "applicationsLoading");
    loadInto(fetchCycles, "cycles", "cyclesLoading");
    loadInto(fetchReviews, "reviews", "reviewsLoading");
    loadInto(fetchReview, "review", null);
    loadInto(fetchMyReview, "myReview", "myReviewLoading");

    [
      createPosting, updatePosting, deletePosting,
      createApplication, moveApplication, reopenApplication,
      createCycle, updateCycle, startCycle,
      submitSelfAssessment, submitReview,
    ].forEach((t) => {
      builder
        .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
        .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
        .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
    });
  },
});

export const { clearReview } = hrSlice.actions;
export default hrSlice.reducer;

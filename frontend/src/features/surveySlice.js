import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Surveys — the school's own feedback forms, and what came back from them.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`survey/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchSurveys = thunk("fetchAll", (params = {}) => apiClient.get("/surveys", { params }), "Failed to load the surveys");
export const fetchMySurveys = thunk("fetchMine", () => apiClient.get("/surveys/mine"), "Failed to load your surveys");

export const createSurvey = thunk("create", (payload) => apiClient.post("/surveys", payload), "Failed to save the survey");
export const updateSurvey = thunk("update", ({ id, ...payload }) => apiClient.patch(`/surveys/${id}`, payload), "Failed to update the survey");
export const openSurvey = thunk("open", (id) => apiClient.post(`/surveys/${id}/open`, {}), "Failed to open the survey");
export const closeSurvey = thunk("close", (id) => apiClient.post(`/surveys/${id}/close`, {}), "Failed to close the survey");
export const deleteSurvey = thunk("remove", (id) => apiClient.delete(`/surveys/${id}`), "Failed to delete the draft");

export const submitResponse = thunk("respond", ({ id, answers }) => apiClient.post(`/surveys/${id}/respond`, { answers }), "Failed to send your answers");
export const fetchMyResponse = thunk("myResponse", (id) => apiClient.get(`/surveys/${id}/my-response`), "Failed to load your answers");

export const fetchResults = thunk("results", (id) => apiClient.get(`/surveys/${id}/results`), "Failed to load the results");
export const fetchPendingRespondents = thunk("pending", (id) => apiClient.get(`/surveys/${id}/pending`), "Failed to load who is outstanding");
export const fetchResponses = thunk("responses", (id) => apiClient.get(`/surveys/${id}/responses`), "Failed to load the responses");

const initialState = {
  surveys: [],
  loading: false,
  mine: [],
  mineLoading: false,
  results: null,
  resultsLoading: false,
  pending: [],
  responses: [],
  // Refused by the API on an anonymous survey — kept so the screen can say why rather than
  // showing an empty table.
  responsesError: null,
  myResponse: null,
  actionLoading: false,
  error: null,
};

const surveySlice = createSlice({
  name: "survey",
  initialState,
  reducers: {
    clearResults: (state) => {
      state.results = null;
      state.pending = [];
      state.responses = [];
      state.responsesError = null;
    },
    clearMyResponse: (state) => { state.myResponse = null; },
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

    loadInto(fetchSurveys, "surveys", "loading");
    loadInto(fetchMySurveys, "mine", "mineLoading");
    loadInto(fetchResults, "results", "resultsLoading");
    loadInto(fetchPendingRespondents, "pending", null);
    loadInto(fetchMyResponse, "myResponse", null);

    builder
      .addCase(fetchResponses.pending, (state) => { state.responsesError = null; })
      .addCase(fetchResponses.fulfilled, (state, action) => { state.responses = action.payload || []; })
      .addCase(fetchResponses.rejected, (state, action) => {
        state.responses = [];
        state.responsesError = action.payload;
      });

    [createSurvey, updateSurvey, openSurvey, closeSurvey, deleteSurvey, submitResponse]
      .forEach((t) => {
        builder
          .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
          .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
          .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
      });
  },
});

export const { clearResults, clearMyResponse } = surveySlice.actions;
export default surveySlice.reducer;

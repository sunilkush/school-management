import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Circulars — the school's numbered notices, and the record of who has read them.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`circular/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchCirculars = thunk("fetchAll", (params = {}) => apiClient.get("/circulars", { params }), "Failed to load the circulars");
export const fetchMyCirculars = thunk("fetchMine", () => apiClient.get("/circulars/mine"), "Failed to load your circulars");
export const fetchCircular = thunk("fetchOne", (id) => apiClient.get(`/circulars/${id}`), "Failed to open the circular");

export const createCircular = thunk("create", (payload) => apiClient.post("/circulars", payload), "Failed to save the circular");
export const updateCircular = thunk("update", ({ id, ...payload }) => apiClient.patch(`/circulars/${id}`, payload), "Failed to update the circular");
export const publishCircular = thunk("publish", (id) => apiClient.post(`/circulars/${id}/publish`, {}), "Failed to publish");
export const archiveCircular = thunk("archive", (id) => apiClient.post(`/circulars/${id}/archive`, {}), "Failed to archive");
export const deleteCircular = thunk("remove", (id) => apiClient.delete(`/circulars/${id}`), "Failed to delete the draft");

export const acknowledgeCircular = thunk("acknowledge", ({ id, note }) => apiClient.post(`/circulars/${id}/acknowledge`, { note }), "Failed to acknowledge");
export const fetchPending = thunk("fetchPending", (id) => apiClient.get(`/circulars/${id}/pending`), "Failed to load who is outstanding");
export const fetchAcknowledgements = thunk("fetchAcks", (id) => apiClient.get(`/circulars/${id}/acknowledgements`), "Failed to load the acknowledgements");

const initialState = {
  circulars: [],
  loading: false,
  mine: [],
  mineLoading: false,
  current: null,
  currentLoading: false,
  pending: [],
  acknowledgements: [],
  actionLoading: false,
  error: null,
};

const circularSlice = createSlice({
  name: "circular",
  initialState,
  reducers: {
    clearCurrent: (state) => { state.current = null; state.pending = []; state.acknowledgements = []; },
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

    loadInto(fetchCirculars, "circulars", "loading");
    loadInto(fetchMyCirculars, "mine", "mineLoading");
    loadInto(fetchCircular, "current", "currentLoading");
    loadInto(fetchPending, "pending", null);
    loadInto(fetchAcknowledgements, "acknowledgements", null);

    [createCircular, updateCircular, publishCircular, archiveCircular, deleteCircular, acknowledgeCircular]
      .forEach((t) => {
        builder
          .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
          .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
          .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
      });
  },
});

export const { clearCurrent } = circularSlice.actions;
export default circularSlice.reducer;

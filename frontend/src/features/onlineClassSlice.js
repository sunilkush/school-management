import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Live online classes. Nothing here hosts video — the school's own meeting link is scheduled,
 * shown at the right time, and the joins are logged.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`onlineClass/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchOnlineClasses = thunk(
  "fetchAll",
  (params = {}) => apiClient.get("/online-classes", { params }),
  "Failed to load the online classes"
);

export const createOnlineClass = thunk(
  "create",
  (payload) => apiClient.post("/online-classes", payload),
  "Failed to schedule the class"
);

export const updateOnlineClass = thunk(
  "update",
  ({ id, ...payload }) => apiClient.patch(`/online-classes/${id}`, payload),
  "Failed to update the class"
);

export const cancelOnlineClass = thunk(
  "cancel",
  ({ id, reason }) => apiClient.delete(`/online-classes/${id}`, { data: { reason } }),
  "Failed to cancel the class"
);

export const setOnlineClassStatus = thunk(
  "setStatus",
  ({ id, status }) => apiClient.patch(`/online-classes/${id}/status`, { status }),
  "Failed to update the class"
);

export const joinOnlineClass = thunk(
  "join",
  (id) => apiClient.post(`/online-classes/${id}/join`, {}),
  "Could not open the class"
);

export const fetchJoins = thunk(
  "fetchJoins",
  (id) => apiClient.get(`/online-classes/${id}/joins`),
  "Failed to load who joined"
);

export const markAttendanceFromJoins = thunk(
  "markAttendance",
  (id) => apiClient.post(`/online-classes/${id}/mark-attendance`, {}),
  "Failed to mark the register"
);

const initialState = {
  classes: [],
  loading: false,
  joins: null,
  joinsLoading: false,
  actionLoading: false,
  error: null,
};

const onlineClassSlice = createSlice({
  name: "onlineClass",
  initialState,
  reducers: {
    clearJoins: (state) => { state.joins = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOnlineClasses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOnlineClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload ?? [];
      })
      .addCase(fetchOnlineClasses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchJoins.pending, (state) => { state.joinsLoading = true; })
      .addCase(fetchJoins.fulfilled, (state, action) => { state.joinsLoading = false; state.joins = action.payload; })
      .addCase(fetchJoins.rejected, (state, action) => { state.joinsLoading = false; state.error = action.payload; });

    [createOnlineClass, updateOnlineClass, cancelOnlineClass, setOnlineClassStatus, joinOnlineClass, markAttendanceFromJoins]
      .forEach((t) => {
        builder
          .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
          .addCase(t.fulfilled, (state) => { state.actionLoading = false; })
          .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
      });
  },
});

export const { clearJoins } = onlineClassSlice.actions;
export default onlineClassSlice.reducer;

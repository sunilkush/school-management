import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ── Staff: Sessions ────────────────────────────────────── */
export const createSession = createAsyncThunk(
  "ptm/createSession",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/ptm/sessions", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getSessions = createAsyncThunk(
  "ptm/getSessions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/ptm/sessions?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getSessionSlots = createAsyncThunk(
  "ptm/getSessionSlots",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/ptm/sessions/${sessionId}/slots`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelSession = createAsyncThunk(
  "ptm/cancelSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/ptm/sessions/${sessionId}/cancel`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAttendance = createAsyncThunk(
  "ptm/markAttendance",
  async ({ id, attended, notes }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/ptm/slots/${id}/attendance`, { attended, notes });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/* ── Parent: Booking ────────────────────────────────────── */
export const getAvailableSlots = createAsyncThunk(
  "ptm/getAvailableSlots",
  async ({ schoolClassId, sectionId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/ptm/slots/available?schoolClassId=${schoolClassId}&sectionId=${sectionId}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const bookSlot = createAsyncThunk(
  "ptm/bookSlot",
  async ({ id, studentId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/ptm/slots/${id}/book`, { studentId });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "ptm/cancelBooking",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/ptm/slots/${id}/cancel-booking`, { reason });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getMyBookings = createAsyncThunk(
  "ptm/getMyBookings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/ptm/slots/my-bookings");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  sessions: [],
  currentSession: null,
  sessionSlots: [],
  availableSlots: [],
  myBookings: [],
  loading: false,
  error: null,
};

const ptmSlice = createSlice({
  name: "ptm",
  initialState,
  reducers: {
    clearPtmError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sessions
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload.session);
      })
      .addCase(createSession.rejected, (state, action) => { state.error = action.payload; })
      .addCase(getSessions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getSessions.fulfilled, (state, action) => { state.loading = false; state.sessions = action.payload || []; })
      .addCase(getSessions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getSessionSlots.fulfilled, (state, action) => {
        state.currentSession = action.payload.session;
        state.sessionSlots = action.payload.slots || [];
      })
      .addCase(cancelSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.map((s) => (s._id === action.payload._id ? action.payload : s));
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.sessionSlots = state.sessionSlots.map((s) => (s._id === action.payload._id ? action.payload : s));
      })

      // Booking
      .addCase(getAvailableSlots.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAvailableSlots.fulfilled, (state, action) => { state.loading = false; state.availableSlots = action.payload || []; })
      .addCase(getAvailableSlots.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(bookSlot.fulfilled, (state, action) => {
        state.availableSlots = state.availableSlots.filter((s) => s._id !== action.payload._id);
      })
      .addCase(bookSlot.rejected, (state, action) => { state.error = action.payload; })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.myBookings = state.myBookings.filter((s) => s._id !== action.payload._id);
      })
      .addCase(getMyBookings.pending, (state) => { state.loading = true; })
      .addCase(getMyBookings.fulfilled, (state, action) => { state.loading = false; state.myBookings = action.payload || []; })
      .addCase(getMyBookings.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearPtmError } = ptmSlice.actions;
export default ptmSlice.reducer;

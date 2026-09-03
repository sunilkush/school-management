import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * Live bus tracking. The driver's device is the only source of positions, so everything here
 * either sends a fix up or reads one back down.
 */

const getError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const thunk = (name, fn, fallback) =>
  createAsyncThunk(`busTracking/${name}`, async (arg, { rejectWithValue }) => {
    try {
      const res = await fn(arg);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, fallback));
    }
  });

export const fetchLiveTrips = thunk(
  "fetchLiveTrips",
  () => apiClient.get("/transport/trips/live"),
  "Failed to load the buses that are running"
);

export const fetchTrips = thunk(
  "fetchTrips",
  (params = {}) => apiClient.get("/transport/trips", { params }),
  "Failed to load trips"
);

export const fetchTripTrail = thunk(
  "fetchTripTrail",
  (id) => apiClient.get(`/transport/trips/${id}`),
  "Failed to load the trip"
);

export const startTrip = thunk(
  "startTrip",
  (payload) => apiClient.post("/transport/trips", payload),
  "Failed to start the trip"
);

export const endTrip = thunk(
  "endTrip",
  ({ id, ...body }) => apiClient.post(`/transport/trips/${id}/end`, body),
  "Failed to end the trip"
);

export const sendPing = thunk(
  "sendPing",
  ({ id, ...fix }) => apiClient.post(`/transport/trips/${id}/ping`, fix),
  "Failed to send the location"
);

export const fetchMyBus = thunk(
  "fetchMyBus",
  (params = {}) => apiClient.get("/transport/trips/my-bus", { params }),
  "Failed to locate the bus"
);

const initialState = {
  liveTrips: [],
  liveLoading: false,
  trips: [],
  tripsLoading: false,
  trail: null,
  trailLoading: false,
  activeTrip: null,
  myBus: null,
  myBusLoading: false,
  // Counted rather than surfaced one by one: a driver on a patchy connection does not need a
  // toast every ten seconds, but a run of failures is worth showing.
  pingFailures: 0,
  lastPingAt: null,
  actionLoading: false,
  error: null,
};

const busTrackingSlice = createSlice({
  name: "busTracking",
  initialState,
  reducers: {
    clearTrail: (state) => { state.trail = null; },
    clearActiveTrip: (state) => { state.activeTrip = null; state.pingFailures = 0; state.lastPingAt = null; },
    setActiveTrip: (state, action) => { state.activeTrip = action.payload; },
  },
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

    loadInto(fetchLiveTrips, "liveTrips", "liveLoading");
    loadInto(fetchTrips, "trips", "tripsLoading");
    loadInto(fetchTripTrail, "trail", "trailLoading");
    loadInto(fetchMyBus, "myBus", "myBusLoading");

    [startTrip, endTrip].forEach((t) => {
      builder
        .addCase(t.pending, (state) => { state.actionLoading = true; state.error = null; })
        .addCase(t.fulfilled, (state, action) => {
          state.actionLoading = false;
          state.activeTrip = t === endTrip ? null : action.payload;
          if (t === endTrip) { state.pingFailures = 0; state.lastPingAt = null; }
        })
        .addCase(t.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
    });

    builder
      .addCase(sendPing.fulfilled, (state, action) => {
        state.pingFailures = 0;
        state.lastPingAt = new Date().toISOString();
        // A throttled ping is not an update — keeping the old trip avoids the map jumping back.
        if (action.payload?.accepted && action.payload.trip) state.activeTrip = action.payload.trip;
      })
      .addCase(sendPing.rejected, (state) => { state.pingFailures += 1; });
  },
});

export const { clearTrail, clearActiveTrip, setActiveTrip } = busTrackingSlice.actions;
export default busTrackingSlice.reducer;

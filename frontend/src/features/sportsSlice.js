import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const cleanQuery = (params) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  return new URLSearchParams(clean).toString();
};

/* ── Teams ──────────────────────────────────────────────── */
export const createTeam = createAsyncThunk("sports/createTeam", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/sports/teams", payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getTeams = createAsyncThunk("sports/getTeams", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`/sports/teams?${cleanQuery(params)}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateTeam = createAsyncThunk("sports/updateTeam", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await apiClient.put(`/sports/teams/${id}`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteTeam = createAsyncThunk("sports/deleteTeam", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/sports/teams/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addTeamMember = createAsyncThunk("sports/addTeamMember", async ({ id, studentId, position }, { rejectWithValue }) => {
  try {
    const res = await apiClient.post(`/sports/teams/${id}/members`, { studentId, position });
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const removeTeamMember = createAsyncThunk("sports/removeTeamMember", async ({ id, studentId }, { rejectWithValue }) => {
  try {
    const res = await apiClient.delete(`/sports/teams/${id}/members/${studentId}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

/* ── Events ─────────────────────────────────────────────── */
export const createEvent = createAsyncThunk("sports/createEvent", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/sports/events", payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getEvents = createAsyncThunk("sports/getEvents", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`/sports/events?${cleanQuery(params)}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateEvent = createAsyncThunk("sports/updateEvent", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await apiClient.put(`/sports/events/${id}`, payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

/* ── Achievements ───────────────────────────────────────── */
export const createAchievement = createAsyncThunk("sports/createAchievement", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/sports/achievements", payload);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getAchievements = createAsyncThunk("sports/getAchievements", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await apiClient.get(`/sports/achievements?${cleanQuery(params)}`);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteAchievement = createAsyncThunk("sports/deleteAchievement", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/sports/achievements/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchMyAchievements = createAsyncThunk("sports/fetchMyAchievements", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/sports/achievements/my");
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  teams: [],
  events: [],
  achievements: [],
  myAchievements: [],
  myLoading: false,
  loading: false,
  error: null,
};

const sportsSlice = createSlice({
  name: "sports",
  initialState,
  reducers: {
    clearSportsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Teams
      .addCase(getTeams.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getTeams.fulfilled, (state, action) => { state.loading = false; state.teams = action.payload || []; })
      .addCase(getTeams.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createTeam.fulfilled, (state, action) => { state.teams.unshift(action.payload); })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.teams = state.teams.map((t) => (t._id === action.payload._id ? action.payload : t));
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter((t) => t._id !== action.payload);
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        state.teams = state.teams.map((t) => (t._id === action.payload._id ? action.payload : t));
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.teams = state.teams.map((t) => (t._id === action.payload._id ? action.payload : t));
      })

      // Events
      .addCase(getEvents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getEvents.fulfilled, (state, action) => { state.loading = false; state.events = action.payload || []; })
      .addCase(getEvents.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createEvent.fulfilled, (state, action) => { state.events.unshift(action.payload); })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.events = state.events.map((e) => (e._id === action.payload._id ? action.payload : e));
      })

      // Achievements
      .addCase(getAchievements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAchievements.fulfilled, (state, action) => { state.loading = false; state.achievements = action.payload || []; })
      .addCase(getAchievements.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createAchievement.fulfilled, (state, action) => { state.achievements.unshift(action.payload); })
      .addCase(deleteAchievement.fulfilled, (state, action) => {
        state.achievements = state.achievements.filter((a) => a._id !== action.payload);
      })
      .addCase(fetchMyAchievements.pending, (state) => { state.myLoading = true; state.error = null; })
      .addCase(fetchMyAchievements.fulfilled, (state, action) => { state.myLoading = false; state.myAchievements = action.payload || []; })
      .addCase(fetchMyAchievements.rejected, (state, action) => { state.myLoading = false; state.error = action.payload; });
  },
});

export const { clearSportsError } = sportsSlice.actions;
export default sportsSlice.reducer;

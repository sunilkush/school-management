import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

export const fetchHostelRooms = createAsyncThunk("hostel/fetchRooms", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/hostel/rooms");
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  } catch (err) {
    return rejectWithValue(getError(err, "Failed to fetch hostel rooms"));
  }
});

export const createHostelRoom = createAsyncThunk("hostel/createRoom", async (payload, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/hostel/rooms", payload);
    return res?.data?.data;
  } catch (err) {
    return rejectWithValue(getError(err, "Failed to create room"));
  }
});

export const updateHostelRoom = createAsyncThunk(
  "hostel/updateRoom",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/hostel/rooms/${id}`, payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to update room"));
    }
  }
);

export const deleteHostelRoom = createAsyncThunk("hostel/deleteRoom", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/hostel/rooms/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getError(err, "Failed to delete room"));
  }
});

export const assignHostelStudent = createAsyncThunk(
  "hostel/assignStudent",
  async ({ id, studentName }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/hostel/rooms/${id}/assign`, { studentName });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to assign student"));
    }
  }
);

export const unassignHostelStudent = createAsyncThunk(
  "hostel/unassignStudent",
  async ({ roomId, studentId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/hostel/rooms/${roomId}/students/${studentId}`);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to unassign student"));
    }
  }
);

const hostelSlice = createSlice({
  name: "hostel",
  initialState: {
    rooms: [],
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearHostelError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHostelRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHostelRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchHostelRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addMatcher(
        (action) => action.type.startsWith("hostel/") && action.type.endsWith("/pending") && action.type !== "hostel/fetchRooms/pending",
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("hostel/") && action.type.endsWith("/fulfilled") && action.type !== "hostel/fetchRooms/fulfilled",
        (state, action) => {
          state.actionLoading = false;
          if (action.type === "hostel/createRoom/fulfilled") {
            state.rooms.unshift(action.payload);
          }
          if (["hostel/updateRoom/fulfilled", "hostel/assignStudent/fulfilled", "hostel/unassignStudent/fulfilled"].includes(action.type)) {
            const idx = state.rooms.findIndex((room) => room._id === action.payload?._id);
            if (idx !== -1) state.rooms[idx] = action.payload;
          }
          if (action.type === "hostel/deleteRoom/fulfilled") {
            state.rooms = state.rooms.filter((room) => room._id !== action.payload);
          }
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("hostel/") && action.type.endsWith("/rejected") && action.type !== "hostel/fetchRooms/rejected",
        (state, action) => {
          state.actionLoading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearHostelError } = hostelSlice.actions;
export default hostelSlice.reducer;

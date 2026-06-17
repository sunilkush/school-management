import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchTickets = createAsyncThunk(
  "tickets/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/support-tickets", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch tickets");
    }
  }
);

export const createTicket = createAsyncThunk(
  "tickets/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/support-tickets", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create ticket");
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  "tickets/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/support-tickets/${id}/status`, { status });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update ticket status");
    }
  }
);

export const resolveTicket = createAsyncThunk(
  "tickets/resolve",
  async ({ id, resolution }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/support-tickets/${id}/resolve`, { resolution });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to resolve ticket");
    }
  }
);

const supportTicketSlice = createSlice({
  name: "tickets",
  initialState: {
    tickets: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload?.tickets || action.payload || [];
        state.total = action.payload?.total || state.tickets.length;
      })
      .addCase(fetchTickets.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createTicket.fulfilled, (state, action) => { state.tickets.unshift(action.payload); state.total += 1; })

      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tickets[idx] = action.payload;
      })

      .addCase(resolveTicket.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tickets[idx] = action.payload;
      });
  },
});

export default supportTicketSlice.reducer;

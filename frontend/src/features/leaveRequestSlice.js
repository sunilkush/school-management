import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchLeaveRequests = createAsyncThunk(
  "leaveRequests/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/leave-requests", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const getMyLeaveRequests = createAsyncThunk(
  "leaveRequests/fetchMine",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/leave-requests/my", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  "leaveRequests/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/leave-requests", payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const approveLeaveRequest = createAsyncThunk(
  "leaveRequests/approve",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(`/leave-requests/${id}/approve`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  "leaveRequests/reject",
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(`/leave-requests/${id}/reject`, {
        rejectionReason,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteLeaveRequest = createAsyncThunk(
  "leaveRequests/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/leave-requests/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  requests: [],
  myRequests: [],
  total: 0,
  loading: false,
  saving: false,
  error: null,
};

const leaveRequestSlice = createSlice({
  name: "leaveRequests",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchLeaveRequests
    builder
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.requests = payload.requests ?? payload;
        state.total =
          payload.total !== undefined
            ? payload.total
            : (payload.requests ?? payload).length;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // getMyLeaveRequests
    builder
      .addCase(getMyLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.myRequests = action.payload;
      })
      .addCase(getMyLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createLeaveRequest
    builder
      .addCase(createLeaveRequest.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action) => {
        state.saving = false;
        state.requests.unshift(action.payload);
        state.myRequests.unshift(action.payload);
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // approveLeaveRequest
    builder.addCase(approveLeaveRequest.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.requests.findIndex((r) => r._id === updated._id);
      if (idx !== -1) state.requests[idx] = updated;
    });

    // rejectLeaveRequest
    builder.addCase(rejectLeaveRequest.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.requests.findIndex((r) => r._id === updated._id);
      if (idx !== -1) state.requests[idx] = updated;
    });

    // deleteLeaveRequest
    builder.addCase(deleteLeaveRequest.fulfilled, (state, action) => {
      const id = action.payload;
      state.requests = state.requests.filter((r) => r._id !== id);
      state.myRequests = state.myRequests.filter((r) => r._id !== id);
    });
  },
});

export default leaveRequestSlice.reducer;

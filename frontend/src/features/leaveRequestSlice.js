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

// Staff CL / EL balances (backend services/leaveBalance.service.js).
export const fetchMyLeaveBalance = createAsyncThunk(
  "leaveRequests/myBalance",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/leave-requests/balance/me", { params });
      return data?.data ?? data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchLeaveBalances = createAsyncThunk(
  "leaveRequests/balances",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/leave-requests/balances", { params });
      return data?.data ?? data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adjustLeaveBalance = createAsyncThunk(
  "leaveRequests/adjustBalance",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/leave-requests/balances/adjust", payload);
      return data?.data ?? data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Comp Off: a Sunday or holiday worked, claimed by staff and approved by an admin. The pages keep
// these lists themselves; the thunks only talk to the API.
const call = (method, url) => createAsyncThunk(`leaveRequests/${method}:${url}`, async (arg = {}, { rejectWithValue }) => {
  try {
    const { id, body, params } = arg || {};
    const path = id ? url.replace(":id", id) : url;
    const { data } = method === "get"
      ? await apiClient.get(path, { params })
      : await apiClient[method](path, body);
    return data?.data ?? data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});
export const claimCompOff       = call("post", "/leave-requests/comp-off");
export const fetchMyCompOffs    = call("get", "/leave-requests/comp-off/my");
export const fetchCompOffClaims = call("get", "/leave-requests/comp-off");
export const approveCompOff     = call("patch", "/leave-requests/comp-off/:id/approve");
export const rejectCompOff      = call("patch", "/leave-requests/comp-off/:id/reject");
export const withdrawCompOff    = call("delete", "/leave-requests/comp-off/:id");

const initialState = {
  myBalance: null,
  balances: { fy: null, rows: [] },
  balancesLoading: false,
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
        // ApiResponse wraps real data under .data: { requests, total, page, limit }
        const inner = action.payload?.data ?? action.payload;
        const arr   = inner?.requests ?? (Array.isArray(inner) ? inner : []);
        state.requests = Array.isArray(arr) ? arr : [];
        state.total    = inner?.total ?? state.requests.length;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchMyLeaveBalance.fulfilled, (state, action) => { state.myBalance = action.payload; })
      .addCase(fetchLeaveBalances.pending, (state) => { state.balancesLoading = true; })
      .addCase(fetchLeaveBalances.fulfilled, (state, action) => {
        state.balancesLoading = false;
        state.balances = { fy: action.payload?.fy ?? null, rows: action.payload?.rows ?? [] };
      })
      .addCase(fetchLeaveBalances.rejected, (state) => { state.balancesLoading = false; });

    // getMyLeaveRequests
    builder
      .addCase(getMyLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        const inner = action.payload?.data ?? action.payload;
        state.myRequests = Array.isArray(inner) ? inner : [];
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
        const newRequest = action.payload?.data ?? action.payload;
        state.requests.unshift(newRequest);
        state.myRequests.unshift(newRequest);
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // approveLeaveRequest
    builder.addCase(approveLeaveRequest.fulfilled, (state, action) => {
      const updated = action.payload?.data ?? action.payload;
      const idx = state.requests.findIndex((r) => r._id === updated._id);
      if (idx !== -1) state.requests[idx] = updated;
    });

    // rejectLeaveRequest
    builder.addCase(rejectLeaveRequest.fulfilled, (state, action) => {
      const updated = action.payload?.data ?? action.payload;
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

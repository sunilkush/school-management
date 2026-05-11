import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await httpClient.get("/notifications", { params });
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load notifications"));
    }
  }
);

export const fetchNotificationAnalytics = createAsyncThunk(
  "notifications/fetchNotificationAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get("/notifications/analytics");
      return response.data?.data || {};
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load notification analytics"));
    }
  }
);

export const createNotification = createAsyncThunk(
  "notifications/createNotification",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await httpClient.post("/notifications", payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create notification"));
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (id, { rejectWithValue }) => {
    try {
      const response = await httpClient.patch(`/notifications/${id}/read`);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to mark notification as read"));
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.patch("/notifications/read-all");
      return response.data?.data || { updatedCount: 0 };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to mark notifications as read"));
    }
  }
);

const initialState = {
  items: [],
  analytics: {},
  loading: false,
  analyticsLoading: false,
  creating: false,
  marking: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchNotificationAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchNotificationAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload;
      })
      .addCase(createNotification.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) state.items.unshift(action.payload);
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.pending, (state) => {
        state.marking = true;
        state.error = null;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.marking = false;
        const updated = action.payload;
        if (!updated?._id) return;
        state.items = state.items.map((item) => (item._id === updated._id ? updated : item));
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.marking = false;
        state.error = action.payload;
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.marking = true;
        state.error = null;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.marking = false;
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.marking = false;
        state.error = action.payload;
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;

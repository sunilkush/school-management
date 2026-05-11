import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const normalizeMessage = (row) => ({
  ...row,
  senderName: row?.senderId?.name || "Unknown",
  senderRole: row?.senderId?.roleId?.name || "User",
  recipientNames: (row?.recipientIds || []).map((recipient) => recipient?.name || recipient?.email || "User"),
});

export const fetchMessageRecipients = createAsyncThunk(
  "messages/fetchRecipients",
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get("/messages/recipients");
      return response?.data?.data || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load recipients"));
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ mailbox = "inbox", search = "" } = {}, { rejectWithValue }) => {
    try {
      const response = await httpClient.get("/messages", { params: { mailbox, search: search.trim() } });
      return {
        mailbox,
        rows: (response?.data?.data || []).map(normalizeMessage),
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load messages"));
    }
  }
);

export const fetchMessageThread = createAsyncThunk(
  "messages/fetchThread",
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await httpClient.get(`/messages/${messageId}/thread`);
      return (response?.data?.data || []).map(normalizeMessage);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load conversation"));
    }
  }
);

export const createMessage = createAsyncThunk(
  "messages/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await httpClient.post("/messages", payload);
      return normalizeMessage(response?.data?.data || {});
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to send message"));
    }
  }
);

export const markMessageRead = createAsyncThunk(
  "messages/markRead",
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await httpClient.patch(`/messages/${messageId}/read`);
      return normalizeMessage(response?.data?.data || { _id: messageId, isRead: true });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to mark message as read"));
    }
  }
);

export const archiveMessage = createAsyncThunk(
  "messages/archive",
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await httpClient.patch(`/messages/${messageId}/archive`);
      return normalizeMessage(response?.data?.data || { _id: messageId });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to archive message"));
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "messages/delete",
  async (messageId, { rejectWithValue }) => {
    try {
      await httpClient.delete(`/messages/${messageId}`);
      return messageId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to remove message"));
    }
  }
);

const initialState = {
  rows: [],
  recipients: [],
  thread: [],
  activeMailbox: "inbox",
  loading: false,
  recipientsLoading: false,
  threadLoading: false,
  saving: false,
  error: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessageThread(state) {
      state.thread = [];
      state.threadLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessageRecipients.pending, (state) => {
        state.recipientsLoading = true;
        state.error = null;
      })
      .addCase(fetchMessageRecipients.fulfilled, (state, action) => {
        state.recipientsLoading = false;
        state.recipients = action.payload;
      })
      .addCase(fetchMessageRecipients.rejected, (state, action) => {
        state.recipientsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeMailbox = action.payload.mailbox;
        state.rows = action.payload.rows;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessageThread.pending, (state) => {
        state.threadLoading = true;
        state.error = null;
      })
      .addCase(fetchMessageThread.fulfilled, (state, action) => {
        state.threadLoading = false;
        state.thread = action.payload;
      })
      .addCase(fetchMessageThread.rejected, (state, action) => {
        state.threadLoading = false;
        state.thread = [];
        state.error = action.payload;
      })
      .addCase(createMessage.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.saving = false;
        if (state.activeMailbox === "sent") state.rows.unshift(action.payload);
        if (action.payload.parentMessageId) state.thread.push(action.payload);
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(markMessageRead.fulfilled, (state, action) => {
        const updatedId = action.payload?._id;
        state.rows = state.rows.map((row) => (row._id === updatedId ? { ...row, ...action.payload, isRead: true } : row));
        state.thread = state.thread.map((row) => (row._id === updatedId ? { ...row, ...action.payload, isRead: true } : row));
      })
      .addCase(archiveMessage.fulfilled, (state, action) => {
        const updatedId = action.payload?._id;
        if (state.activeMailbox !== "archive") {
          state.rows = state.rows.filter((row) => row._id !== updatedId);
        } else {
          state.rows = state.rows.map((row) => (row._id === updatedId ? { ...row, ...action.payload } : row));
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.rows = state.rows.filter((row) => row._id !== action.payload);
        state.thread = state.thread.filter((row) => row._id !== action.payload);
      });
  },
});

export const { clearMessageThread } = messageSlice.actions;
export default messageSlice.reducer;

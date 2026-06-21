import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchTasks = createAsyncThunk("tasks/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/tasks", { params });
    return res.data?.data || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch tasks");
  }
});

export const fetchAssignableUsers = createAsyncThunk("tasks/assignableUsers", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/tasks/assignable-users");
    return res.data?.data || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
  }
});

export const createTask = createAsyncThunk("tasks/create", async (data, { rejectWithValue }) => {
  try {
    const res = await apiClient.post("/tasks", data);
    return res.data?.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create task");
  }
});

export const updateTask = createAsyncThunk("tasks/update", async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const res = await apiClient.patch(`/tasks/${id}`, data);
    return res.data?.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update task");
  }
});

export const deleteTask = createAsyncThunk("tasks/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/tasks/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete task");
  }
});

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    items: [],
    assignableUsers: [],
    loading: false,
    usersLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTasks.fulfilled,  (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchTasks.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAssignableUsers.pending,   (s) => { s.usersLoading = true; })
      .addCase(fetchAssignableUsers.fulfilled, (s, a) => { s.usersLoading = false; s.assignableUsers = a.payload; })
      .addCase(fetchAssignableUsers.rejected,  (s) => { s.usersLoading = false; })

      .addCase(createTask.fulfilled, (s, a) => { if (a.payload) s.items.unshift(a.payload); })

      .addCase(updateTask.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex((t) => t._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })

      .addCase(deleteTask.fulfilled, (s, a) => {
        s.items = s.items.filter((t) => t._id !== a.payload);
      });
  },
});

export default taskSlice.reducer;

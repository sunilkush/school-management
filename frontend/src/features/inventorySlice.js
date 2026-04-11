import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

export const fetchInventoryItems = createAsyncThunk(
  "inventory/fetchItems",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/inventory", { params });
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to fetch inventory items"));
    }
  }
);

export const createInventoryItem = createAsyncThunk(
  "inventory/createItem",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/inventory", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to create inventory item"));
    }
  }
);

export const updateInventoryItem = createAsyncThunk(
  "inventory/updateItem",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/inventory/${id}`, payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to update inventory item"));
    }
  }
);

export const deleteInventoryItem = createAsyncThunk(
  "inventory/deleteItem",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/inventory/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err, "Failed to delete inventory item"));
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    items: [],
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("inventory/") &&
          action.type.endsWith("/pending") &&
          action.type !== "inventory/fetchItems/pending",
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("inventory/") &&
          action.type.endsWith("/fulfilled") &&
          action.type !== "inventory/fetchItems/fulfilled",
        (state, action) => {
          state.actionLoading = false;

          if (action.type === "inventory/createItem/fulfilled") {
            state.items.unshift(action.payload);
          }

          if (action.type === "inventory/updateItem/fulfilled") {
            const index = state.items.findIndex((item) => item._id === action.payload?._id);
            if (index !== -1) state.items[index] = action.payload;
          }

          if (action.type === "inventory/deleteItem/fulfilled") {
            state.items = state.items.filter((item) => item._id !== action.payload);
          }
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("inventory/") &&
          action.type.endsWith("/rejected") &&
          action.type !== "inventory/fetchItems/rejected",
        (state, action) => {
          state.actionLoading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
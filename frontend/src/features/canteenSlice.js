import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ── Menu Items ─────────────────────────────────────────── */
export const fetchItems = createAsyncThunk(
  "canteen/fetchItems",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/canteen/items?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createItem = createAsyncThunk(
  "canteen/createItem",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/canteen/items", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateItem = createAsyncThunk(
  "canteen/updateItem",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/canteen/items/${id}`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteItem = createAsyncThunk(
  "canteen/deleteItem",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/canteen/items/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/* ── Wallet ─────────────────────────────────────────────── */
export const fetchWallet = createAsyncThunk(
  "canteen/fetchWallet",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/canteen/wallet/${studentId}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const topUpCash = createAsyncThunk(
  "canteen/topUpCash",
  async ({ studentId, amount }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/canteen/wallet/${studentId}/topup`, { amount });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createRazorpayTopUpOrder = createAsyncThunk(
  "canteen/createRazorpayTopUpOrder",
  async ({ studentId, amount }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/canteen/wallet/${studentId}/topup/razorpay-order`, { amount });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyRazorpayTopUp = createAsyncThunk(
  "canteen/verifyRazorpayTopUp",
  async ({ studentId, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/canteen/wallet/${studentId}/topup/razorpay-verify`, {
        amount, razorpay_order_id, razorpay_payment_id, razorpay_signature,
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "canteen/fetchTransactions",
  async ({ studentId, ...params }, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/canteen/wallet/${studentId}/transactions?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/* ── Orders (POS) ───────────────────────────────────────── */
export const createOrder = createAsyncThunk(
  "canteen/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/canteen/orders", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchOrders = createAsyncThunk(
  "canteen/fetchOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/canteen/orders?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "canteen/cancelOrder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/canteen/orders/${id}/cancel`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  items: [],
  wallet: null,
  transactions: [],
  orders: [],
  pagination: null,
  loading: false,
  error: null,
};

const canteenSlice = createSlice({
  name: "canteen",
  initialState,
  reducers: {
    clearCanteenError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Items
      .addCase(fetchItems.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchItems.fulfilled, (state, action) => { state.loading = false; state.items = action.payload || []; })
      .addCase(fetchItems.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createItem.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.items = state.items.map((i) => (i._id === action.payload._id ? action.payload : i));
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      })

      // Wallet
      .addCase(fetchWallet.fulfilled, (state, action) => { state.wallet = action.payload; })
      .addCase(topUpCash.fulfilled, (state, action) => { state.wallet = action.payload.wallet; })
      .addCase(verifyRazorpayTopUp.fulfilled, (state, action) => { state.wallet = action.payload.wallet; })
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload?.transactions || [];
      })
      .addCase(fetchTransactions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Orders
      .addCase(createOrder.fulfilled, (state, action) => { state.orders.unshift(action.payload); })
      .addCase(createOrder.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.orders || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.orders = state.orders.map((o) => (o._id === action.payload._id ? action.payload : o));
      });
  },
});

export const { clearCanteenError } = canteenSlice.actions;
export default canteenSlice.reducer;

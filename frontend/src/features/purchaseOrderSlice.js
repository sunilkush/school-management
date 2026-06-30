import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const err = (e, fb) => e?.response?.data?.message || e?.message || fb;

export const fetchPurchaseOrders = createAsyncThunk("po/fetch", async (params = {}, { rejectWithValue }) => {
  try { const r = await apiClient.get("/purchase-orders", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to fetch orders")); }
});

export const fetchPOById = createAsyncThunk("po/fetchOne", async (id, { rejectWithValue }) => {
  try { const r = await apiClient.get(`/purchase-orders/${id}`); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to fetch order")); }
});

export const createPO = createAsyncThunk("po/create", async (data, { rejectWithValue }) => {
  try { const r = await apiClient.post("/purchase-orders", data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to create order")); }
});

export const updatePO = createAsyncThunk("po/update", async ({ id, ...data }, { rejectWithValue }) => {
  try { const r = await apiClient.put(`/purchase-orders/${id}`, data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to update order")); }
});

export const updatePOStatus = createAsyncThunk("po/status", async ({ id, ...data }, { rejectWithValue }) => {
  try { const r = await apiClient.patch(`/purchase-orders/${id}/status`, data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to update status")); }
});

export const deletePO = createAsyncThunk("po/delete", async (id, { rejectWithValue }) => {
  try { await apiClient.delete(`/purchase-orders/${id}`); return id; }
  catch (e) { return rejectWithValue(err(e, "Failed to delete order")); }
});

const upsert = (list, item) => {
  const i = list.findIndex(p => p._id === item?._id);
  if (i !== -1) list[i] = item; else list.unshift(item);
};

const poSlice = createSlice({
  name: "po",
  initialState: { orders: [], selectedOrder: null, loading: false, actionLoading: false, error: null },
  reducers: { clearPOError: (s) => { s.error = null; }, clearSelectedOrder: (s) => { s.selectedOrder = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchPurchaseOrders.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPurchaseOrders.fulfilled, (s, a) => { s.loading = false; s.orders = a.payload; })
      .addCase(fetchPurchaseOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchPOById.fulfilled,         (s, a) => { s.selectedOrder = a.payload; })
      .addCase(createPO.fulfilled,            (s, a) => { s.orders.unshift(a.payload); s.actionLoading = false; })
      .addCase(updatePO.fulfilled,            (s, a) => { upsert(s.orders, a.payload); s.actionLoading = false; })
      .addCase(updatePOStatus.fulfilled,      (s, a) => { upsert(s.orders, a.payload); s.actionLoading = false; })
      .addCase(deletePO.fulfilled,            (s, a) => { s.orders = s.orders.filter(o => o._id !== a.payload); s.actionLoading = false; })
      .addMatcher((a) => a.type.startsWith("po/") && a.type.endsWith("/pending") && a.type !== "po/fetch/pending",   (s) => { s.actionLoading = true; s.error = null; })
      .addMatcher((a) => a.type.startsWith("po/") && a.type.endsWith("/rejected") && a.type !== "po/fetch/rejected", (s, a) => { s.actionLoading = false; s.error = a.payload; });
  },
});
export const { clearPOError, clearSelectedOrder } = poSlice.actions;
export default poSlice.reducer;

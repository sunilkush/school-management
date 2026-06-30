import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const err = (e, fb) => e?.response?.data?.message || e?.message || fb;

export const fetchVendors = createAsyncThunk("vendor/fetch", async (params = {}, { rejectWithValue }) => {
  try { const r = await apiClient.get("/vendors", { params }); return r.data?.data || []; }
  catch (e) { return rejectWithValue(err(e, "Failed to fetch vendors")); }
});

export const createVendor = createAsyncThunk("vendor/create", async (data, { rejectWithValue }) => {
  try { const r = await apiClient.post("/vendors", data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to create vendor")); }
});

export const updateVendor = createAsyncThunk("vendor/update", async ({ id, ...data }, { rejectWithValue }) => {
  try { const r = await apiClient.put(`/vendors/${id}`, data); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to update vendor")); }
});

export const toggleVendor = createAsyncThunk("vendor/toggle", async (id, { rejectWithValue }) => {
  try { const r = await apiClient.patch(`/vendors/${id}/toggle`); return r.data?.data; }
  catch (e) { return rejectWithValue(err(e, "Failed to toggle vendor")); }
});

export const deleteVendor = createAsyncThunk("vendor/delete", async (id, { rejectWithValue }) => {
  try { await apiClient.delete(`/vendors/${id}`); return id; }
  catch (e) { return rejectWithValue(err(e, "Failed to delete vendor")); }
});

const vendorSlice = createSlice({
  name: "vendor",
  initialState: { vendors: [], loading: false, actionLoading: false, error: null },
  reducers: { clearVendorError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchVendors.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchVendors.fulfilled, (s, a) => { s.loading = false; s.vendors = a.payload; })
      .addCase(fetchVendors.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createVendor.fulfilled, (s, a) => { s.vendors.unshift(a.payload); s.actionLoading = false; })
      .addCase(updateVendor.fulfilled, (s, a) => { const i = s.vendors.findIndex(v => v._id === a.payload?._id); if (i !== -1) s.vendors[i] = a.payload; s.actionLoading = false; })
      .addCase(toggleVendor.fulfilled, (s, a) => { const i = s.vendors.findIndex(v => v._id === a.payload?._id); if (i !== -1) s.vendors[i] = a.payload; s.actionLoading = false; })
      .addCase(deleteVendor.fulfilled, (s, a) => { s.vendors = s.vendors.filter(v => v._id !== a.payload); s.actionLoading = false; })
      .addMatcher((a) => a.type.startsWith("vendor/") && a.type.endsWith("/pending") && a.type !== "vendor/fetch/pending",   (s) => { s.actionLoading = true; s.error = null; })
      .addMatcher((a) => a.type.startsWith("vendor/") && a.type.endsWith("/rejected") && a.type !== "vendor/fetch/rejected", (s, a) => { s.actionLoading = false; s.error = a.payload; });
  },
});
export const { clearVendorError } = vendorSlice.actions;
export default vendorSlice.reducer;

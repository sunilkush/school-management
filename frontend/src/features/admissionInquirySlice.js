import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const BASE = "/admission-inquiries";

export const fetchInquiries = createAsyncThunk(
  "admissionInquiry/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(BASE, { params });
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch inquiries");
    }
  }
);

export const fetchInquiryStats = createAsyncThunk(
  "admissionInquiry/stats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`${BASE}/stats`);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

export const createInquiry = createAsyncThunk(
  "admissionInquiry/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(BASE, data);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create inquiry");
    }
  }
);

export const updateInquiry = createAsyncThunk(
  "admissionInquiry/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`${BASE}/${id}`, data);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update inquiry");
    }
  }
);

export const deleteInquiry = createAsyncThunk(
  "admissionInquiry/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`${BASE}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete inquiry");
    }
  }
);

const initialState = {
  inquiries: [],
  total:     0,
  page:      1,
  stats:     {},
  loading:   false,
  saving:    false,
  error:     null,
};

const admissionInquirySlice = createSlice({
  name: "admissionInquiry",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* fetch list */
      .addCase(fetchInquiries.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchInquiries.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchInquiries.fulfilled, (s, a) => {
        s.loading = false;
        const inner = a.payload?.data ?? a.payload;
        s.inquiries = Array.isArray(inner?.inquiries) ? inner.inquiries
                    : Array.isArray(inner) ? inner : [];
        s.total = inner?.total ?? s.inquiries.length;
        s.page  = inner?.page  ?? 1;
      })

      /* stats */
      .addCase(fetchInquiryStats.fulfilled, (s, a) => {
        s.stats = a.payload ?? {};
      })

      /* create */
      .addCase(createInquiry.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(createInquiry.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(createInquiry.fulfilled, (s, a) => {
        s.saving = false;
        const item = a.payload?.data ?? a.payload;
        if (item?._id) { s.inquiries.unshift(item); s.total += 1; }
      })

      /* update */
      .addCase(updateInquiry.pending,   (s) => { s.saving = true; s.error = null; })
      .addCase(updateInquiry.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
      .addCase(updateInquiry.fulfilled, (s, a) => {
        s.saving = false;
        const updated = a.payload?.data ?? a.payload;
        if (updated?._id) {
          s.inquiries = s.inquiries.map((i) => i._id === updated._id ? updated : i);
        }
      })

      /* delete */
      .addCase(deleteInquiry.fulfilled, (s, a) => {
        s.inquiries = s.inquiries.filter((i) => i._id !== a.payload);
        s.total = Math.max(0, s.total - 1);
      });
  },
});

export default admissionInquirySlice.reducer;

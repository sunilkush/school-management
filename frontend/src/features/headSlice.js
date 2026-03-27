import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const API_BASE_URL = import.meta.env.VITE_API_URL;
/* =====================================================
   ✅ CREATE FEE HEAD
===================================================== */
export const createFeeHead = createAsyncThunk(
  "feeHeads/create",
  async (data, { rejectWithValue }) => {
    try {

      const res = await apiClient.post(
        `/fee-heads`,
        data, // 👈 normal JSON
        {
          headers: {
          },
        }
      );

      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create fee head"
      );
    }
  }
);


export const fetchFeeHeads = createAsyncThunk(
  "feeHeads/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/fee-heads/`, {
        headers: {
        },
        params,
      });
      return res.data.data || res.data;
    }
    catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch fee heads"
      );
    }}
);

export const fetchFeeHeadsBySchool = createAsyncThunk(
  "feeHeads/fetchBySchool",
  async (params, { rejectWithValue }) => {
    try {

      const res = await apiClient.get(`/fee-heads/by-school/`, {
        headers: {
        },
        params, // ✅ yahin aayega
      });

      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch fee heads by school"
      );
    }
  }
);

/* =====================================================
   ✅ FEE HEAD SLICE
===================================================== */
const headSlice = createSlice({
  name: "feeHead",
  initialState: {
    loading: false,
    success: false,
    error: null,
    lead: null,
    feeHeads: [],
    feeHeadsList:[]
  },

  reducers: {
    resetLeadState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.lead = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(createFeeHead.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createFeeHead.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lead = action.payload;
      })
      .addCase(createFeeHead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFeeHeads.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(fetchFeeHeads.fulfilled, (state, action) => {
            state.loading = false;
            state.feeHeads = action.payload?.data || action.payload || [];
        })
        .addCase(fetchFeeHeads.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        .addCase(fetchFeeHeadsBySchool.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchFeeHeadsBySchool.fulfilled, (state, action) => {
            state.loading = false;
            state.feeHeadsList = action.payload?.data || action.payload || [];
        })
        .addCase(fetchFeeHeadsBySchool.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
  },
});

export const { resetLeadState } = headSlice.actions;
export default headSlice.reducer;

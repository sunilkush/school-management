import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";


/* ===============================
   FETCH ALL FEES (ADMIN SIDE)
================================ */
export const fetchAllFees = createAsyncThunk(
  "fees/fetchAll",
  async (params, { rejectWithValue }) => {
    try {

      const res = await apiClient.get(`/fees/allFees`, { params });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || "Failed to load fees");
    }
  }
);


/* ===============================
   CREATE FEES (Super Admin + School Admin)
================================ */
export const createFee = createAsyncThunk(
  "fees/create",
  async (payload, { rejectWithValue }) => {
    try {

      const res = await apiClient.post(`/fees/createFees`, payload);

      // Single created fee
      return res.data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || "Failed to create fee");
    }
  }
);

/* ===============================
   DELETE FEE
================================ */
export const deleteFees = createAsyncThunk(
  "fees/delete",
  async (id, { rejectWithValue }) => {
    try {

      await apiClient.delete(`/fees/${id}`);

      return id;
    } catch (e) {
      return rejectWithValue(e.response?.data || "Delete failed");
    }
  }
);

/* ===============================
   STUDENT / PARENT FEES HISTORY
================================ */
export const fetchStudentFees = createAsyncThunk(
  "fees/student",
  async (studentId, { rejectWithValue }) => {
    try {

      const res = await apiClient.get(`/student-fees/my/${studentId}`);

      return res.data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || "Failed to load student fees");
    }
  }
);

/* ===============================
     SLICE
================================ */
const feesSlice = createSlice({
  name: "fees",

  initialState: {
    feesList: [],
    loading: false,
    error: null,

    total: 0,
    page: 1,
    limit: 10,
  },

  reducers: {
    clearFeesState: (state) => {
      state.feesList = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* FETCH ALL */
      .addCase(fetchAllFees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllFees.fulfilled, (state, action) => {
        state.loading = false;
        // backend: ApiResponse wraps data in .data; thunk returns res.data
        const payload = action.payload?.data;
        state.feesList = Array.isArray(payload) ? payload : (payload?.data || payload?.fees || []);
        state.total = action.payload?.data?.total || (Array.isArray(payload) ? payload.length : 0);
        state.page = action.payload?.data?.page || 1;
        state.limit = action.payload?.data?.limit || 10;
      })
      .addCase(fetchAllFees.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.feesList = [];
      })

      /* CREATE */
      .addCase(createFee.pending, (state) => {
        state.loading = true;
      })
      .addCase(createFee.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ Real-time add on top
        state.feesList.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createFee.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      /* DELETE */
      .addCase(deleteFees.fulfilled, (state, action) => {
        state.feesList = state.feesList.filter(
          (fee) => fee._id !== action.payload
        );
        state.total -= 1;
      })

      /* STUDENT/PARENT FEES */
      .addCase(fetchStudentFees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentFees.fulfilled, (state, action) => {
        state.loading = false;
        state.feesList = action.payload || [];
      })
      .addCase(fetchStudentFees.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export const { clearFeesState } = feesSlice.actions;
export default feesSlice.reducer;

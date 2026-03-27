import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";


const API_BASE_URL = import.meta.env.VITE_API_URL;

/* ===============================
   FETCH ALL FEES (ADMIN SIDE)
================================ */
export const fetchAllFees = createAsyncThunk(
  "fees/fetchAll",
  async (params, { rejectWithValue }) => {
    try {

      const res = await apiClient.get(`${API_BASE_URL}/fees/allFees`, {
        headers: {
        },
        params,
      });

      console.log("Fetched Fees:", res.data);

      // ✅ RETURN FULL RESPONSE
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

      const res = await apiClient.post(
        `${API_BASE_URL}/fees/createFees`,
        payload,
        {
          headers: {
          },
        }
      );

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

      await apiClient.delete(`${API_BASE_URL}/fees/${id}`, {
        headers: {
        },
      });

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

      const res = await apiClient.get(
        `${API_BASE_URL}/student-fees/${studentId}`,
        {
          headers: {
          },
        }
      );

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

        state.feesList = action.payload?.data?.data || [];
        state.total = action.payload?.data?.total || 0;
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

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS (School Admin)
===================================================== */
export const assignFeesToStudents = createAsyncThunk(
  "studentFee/assign",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(
        `/student-fees/assign`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =====================================================
   ✅ GET MY FEES (Student / Parent)
===================================================== */
export const fetchMyFees = createAsyncThunk(
  "studentFee/fetchMyFees",
  async (studentIdentifier, { rejectWithValue }) => {
    try {
      const studentId =
        typeof studentIdentifier === "object"
          ? studentIdentifier?.studentId
          : studentIdentifier;

      if (!studentId) {
        return rejectWithValue("Student ID is required");
      }

   
      const { data } = await apiClient.get(`/student-fees/my/${studentId}`);

      const normalizedFees = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.data)
        ? data.data.data
        : [];

      return normalizedFees;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


/* =====================================================
   ✅ PAY STUDENT FEE
===================================================== */
export const payStudentFee = createAsyncThunk(
  "studentFee/pay",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(
        `/student-fees/pay/${id}`,
        payload,
        {
          headers: {
          },
        }
      );
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =====================================================
   ✅ FEES SUMMARY (School Admin)
===================================================== */
export const fetchStudentFeeSummary = createAsyncThunk(
  "studentFee/summary",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/student-fees/summary`, {
        headers: {
        },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =====================================================
   ✅ SLICE
===================================================== */
const studentFeeSlice = createSlice({
  name: "studentFee",
  initialState: {
    myFees: [],
    summary: [],
    loading: false,
    error: null,
    success: false,
  },

  reducers: {
    resetStudentFeeState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ===== ASSIGN ===== */
      .addCase(assignFeesToStudents.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignFeesToStudents.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(assignFeesToStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== MY FEES ===== */
      .addCase(fetchMyFees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyFees.fulfilled, (state, action) => {
        state.loading = false;
        state.myFees = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== PAY ===== */
      .addCase(payStudentFee.pending, (state) => {
        state.loading = true;
      })
      .addCase(payStudentFee.fulfilled, (state, action) => {
        state.loading = false;

        // update local fee status
        const index = state.myFees.findIndex(
          (f) => f._id === action.payload._id
        );
        if (index !== -1) {
          state.myFees[index] = action.payload;
        }
      })
      .addCase(payStudentFee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== SUMMARY ===== */
      .addCase(fetchStudentFeeSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentFeeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchStudentFeeSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetStudentFeeState } = studentFeeSlice.actions;
export default studentFeeSlice.reducer;

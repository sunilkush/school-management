import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const Api_Base_Url = import.meta.env.VITE_API_URL;
/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS (School Admin)
===================================================== */
export const assignFeesToStudents = createAsyncThunk(
  "studentFee/assign",
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.post(
        `${Api_Base_Url}/student-fees/assign`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
  async (studentId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const url = studentId
        ? `${Api_Base_Url}/student-fees/my/${studentId}`
        : `${Api_Base_Url}/student-fees/my`;

      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
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
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.put(
        `${Api_Base_Url}/student-fees/pay/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.get(`${Api_Base_Url}/student-fees/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
        state.myFees = action.payload;
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

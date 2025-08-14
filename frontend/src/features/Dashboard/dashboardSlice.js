import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const App_Base_Url = import.meta.env.VITE_API_URL;

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchDashboardSummary",
  async ({ role, schoolId }, { rejectWithValue }) => {
    try {
        
      const token = localStorage.getItem("accessToken");

      // Build query params conditionally
      let params = { role };
      if (role !== "Super Admin" && schoolId) {
        params.schoolId = schoolId;
      }

      const response = await axios.get(`${App_Base_Url}/dashboard/summary`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Extract inner data so reducer doesn't have to deal with wrapping object
      return { role, data: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardData: (state) => {
      state.summary = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        const { role, data } = action.payload;

        if (role === "Super Admin") {
          state.summary = [
            { title: "Total Schools", value: data.schools },
            { title: "Total Admin", value: data.admins },
            { title: "Total Teachers", value: data.teachers },
            { title: "Fees Collected", value: data.feesCollected, format: "currency" },
          ];
        } else if (role === "School Admin") {
          state.summary = [
            { title: "Students", value: data.students },
            { title: "Teachers", value: data.teachers },
            { title: "Classes", value: data.classes },
            { title: "Fees Collected", value: data.feesCollected, format: "currency" },
          ];
        } else if (role === "Teacher") {
          state.summary = [
            { title: "My Classes", value: data.classes },
            { title: "Students in Class", value: data.students },
            { title: "Attendance Today", value: data.presentPercent, format: "percent" },
          ];
        } else {
          state.summary = [];
        }
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;

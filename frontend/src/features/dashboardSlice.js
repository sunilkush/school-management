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
        params, // role + schoolId go here
        headers: { Authorization: `Bearer ${token}` },
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

        // ❌ Safety check (important)
        if (!data || typeof data !== "object") {
          state.summary = [];
          state.error = "No data found";
          return;
        }

        if (role === "Super Admin") {
          state.summary = [
            { title: "Total Schools", value: data.schools || 0 },
            { title: "Total Admin", value: data.admins || 0 },
            { title: "Total Users", value: data.users || 0 },
            { title: "Fees Collected", value: data.feesCollected || 0, format: "currency" },
          ];
        } else if (role === "School Admin") {
          state.summary = [
            { title: "Students", value: data.students || 0 },
            { title: "Teachers", value: data.teachers || 0 },
            { title: "Classes", value: data.classes || 0 },
            { title: "Fees Collected", value: data.feesCollected || 0, format: "currency" },
          ];
        } else {
          state.summary = [];
        }

        state.error = null;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.summary = [];

        // ✅ API message store karo
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          "Failed to load dashboard";
      })
      
  },
});

export const { clearDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;

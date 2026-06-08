import apiClient from "../api/httpClient";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const toRoleName = (role = "") => String(role).trim().toLowerCase();
const unwrapApiEnvelope = (payload) => {
  let current = payload;

  while (
    current &&
    typeof current === "object" &&
    !Array.isArray(current) &&
    Object.prototype.hasOwnProperty.call(current, "data") &&
    Object.prototype.hasOwnProperty.call(current, "success")
  ) {
    current = current.data;
  }

  return current;
};
const toSummaryValue = (value) => {
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const unwrapped = unwrapApiEnvelope(value);

    if (unwrapped !== value) return toSummaryValue(unwrapped);
    if (typeof value.message === "string") return value.message;
  }

  return 0;
};
const toTitleFromKey = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchDashboardSummary",
  async ({ role, schoolId }, { rejectWithValue }) => {
    try {

      // Build query params conditionally
      let params = { role };
      if (role !== "Super Admin" && schoolId) {
        params.schoolId = schoolId;
      }

      const response = await apiClient.get(`/dashboard/summary`, {
        params, // role + schoolId go here
      });

      // Extract and unwrap API envelopes so React never receives a response object as card text.
      return { role, data: unwrapApiEnvelope(response.data?.data ?? response.data) };
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

        const { role } = action.payload;
        const data = unwrapApiEnvelope(action.payload?.data);
        const normalizedRole = toRoleName(role);

        // ❌ Safety check (important)
        if (!data || typeof data !== "object") {
          state.summary = [];
          state.error = "No data found";
          return;
        }

        if (normalizedRole === "super admin") {
          state.summary = [
            { title: "Total Schools", value: data.schools || 0 },
            { title: "Total Admin", value: data.admins || 0 },
            { title: "Total Users", value: data.users || 0 },
            { title: "Fees Collected", value: data.feesCollected || 0, format: "currency" },
          ];
        } else if (normalizedRole === "school admin") {
          state.summary = [
            { title: "Students", value: data.students || 0 },
            { title: "Teachers", value: data.teachers || 0 },
            { title: "Classes", value: data.classes || 0 },
            { title: "Fees Collected", value: data.feesCollected || 0, format: "currency" },
          ];
        } else if (normalizedRole === "teacher") {
          state.summary = [
            { title: "Students", value: data.students || 0 },
            { title: "Attendance Marked", value: data.attendanceMarked || 0 },
          ];
        } else {
          state.summary = Object.entries(data).map(([key, value]) => ({
            title: toTitleFromKey(key),
            value: toSummaryValue(value),
          }));
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
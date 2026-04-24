// features/subscriptionPlanSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

// ==========================================================
// ✅ 1. Create Subscription Plan
// ==========================================================
export const createSubscriptionPlan = createAsyncThunk(
  "subscriptionPlans/createSubscriptionPlan",
  async (planData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        `/super-admin/billing/plans`,
        planData,
        {
            headers: {
            },
         }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create plan!"
      );
    }
  }
);

// ==========================================================
// ✅ 2. Fetch All Subscription Plans
// ==========================================================
export const fetchSubscriptionPlans = createAsyncThunk(
  "subscriptionPlans/fetchSubscriptionPlans",
  async (_, { rejectWithValue }) => {
    try {
        const res = await apiClient.get(
        `/subscription/allplan`,
         {
            headers: {
            },
         }
      );

      return res.data.data; // API ka actual data
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load plans!"
      );
    }
  }
);


// ==========================================================
// ✅ 3. Update Subscription Plan
// ==========================================================
export const updateSubscriptionPlan = createAsyncThunk(
  "subscriptionPlans/updateSubscriptionPlan",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(
        `/super-admin/billing/plans/${id}`,
        formData,
       {
            headers: {
            },
         }
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Plan update failed!"
      );
    }
  }
);

// ==========================================================
// ❌ 4. Delete Subscription Plan
// ==========================================================
export const deleteSubscriptionPlan = createAsyncThunk(
  "subscriptionPlans/deleteSubscriptionPlan",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(
        `/super-admin/billing/plans/${id}`,
       {
            headers: {
            },
         }
      );
      return res.data; // contains deleted _id
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete plan!"
      );
    }
  }
);

// ==========================================================
// 📜 5. Fetch Plan Logs
//    GET /subscription/:id/logs
// ==========================================================
export const fetchPlanLogs = createAsyncThunk(
  "subscriptionPlans/fetchPlanLogs",
  async (planId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(
        `/subscription/${planId}/logs`,
        {
            headers: {
            },
         }
      );
      return res.data?.data ?? [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch logs!"
      );
    }
  }
);

// ==========================================================
// 🧩 Initial State
// ==========================================================
const initialState = {
  loading: false,
  error: null,

  plans: [],
  planLogs: [],

  success: false,
  successMessage: null,
};

// ==========================================================
// ⚙️ Slice Definition
// ==========================================================
const subscriptionPlanSlice = createSlice({
  name: "subscriptionPlans",
  initialState,
  reducers: {
    clearSubscriptionMessages: (state) => {
      state.successMessage = null;
      state.error = null;
      state.success = false;
    },
  },

  extraReducers: (builder) => {
    builder
      // ============================================
      // ➕ Create Plan
      // ============================================
      .addCase(createSubscriptionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscriptionPlan.fulfilled, (state, action) => {
        const newPlan = action.payload?.data;
        if (newPlan) state.plans.unshift(newPlan);

        state.loading = false;
        state.success = true;
        state.successMessage =
          action.payload?.message || "Subscription Plan created!";
      })
      .addCase(createSubscriptionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 🔁 Fetch All Plans
      // ============================================
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload || [];
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // ✏️ Update Plan
      // ============================================
      .addCase(updateSubscriptionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubscriptionPlan.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.plans.findIndex((p) => p._id === updated._id);
          if (index !== -1) state.plans[index] = updated;
        }

        state.loading = false;
        state.success = true;
        state.successMessage = "Plan updated successfully!";
      })
      .addCase(updateSubscriptionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // ❌ Delete
      // ============================================
      .addCase(deleteSubscriptionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubscriptionPlan.fulfilled, (state, action) => {
        const deletedId = action.meta.arg;
        state.plans = state.plans.map((p) =>
          p._id === deletedId ? { ...p, isActive: false } : p
        );

        state.loading = false;
        state.success = true;
        state.successMessage = "Plan deactivated successfully!";
      })
      .addCase(deleteSubscriptionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 📜 Fetch Logs
      // ============================================
      .addCase(fetchPlanLogs.pending, (state) => {
        state.loading = true;
        state.planLogs = [];
      })
      .addCase(fetchPlanLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.planLogs = action.payload || [];
      })
      .addCase(fetchPlanLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export Actions
export const { clearSubscriptionMessages } = subscriptionPlanSlice.actions;

// Export Reducer
export default subscriptionPlanSlice.reducer;

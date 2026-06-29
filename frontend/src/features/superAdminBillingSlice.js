import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchBillingInvoices = createAsyncThunk("superAdminBilling/fetchInvoices", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/super-admin/billing/invoices");
    return res.data?.data || [];
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to fetch invoices");
  }
});

export const fetchBillingPayments = createAsyncThunk("superAdminBilling/fetchPayments", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/super-admin/billing/payments");
    return res.data?.data || [];
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to fetch payments");
  }
});

export const fetchRevenueSummary = createAsyncThunk("superAdminBilling/fetchRevenueSummary", async (_, { rejectWithValue }) => {
  try {
    const res = await apiClient.get("/super-admin/billing/revenue/summary");
    return res.data?.data || {};
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to fetch revenue summary");
  }
});

export const addManualSubscriptionPayment = createAsyncThunk(
  "superAdminBilling/addManualSubscriptionPayment",
  async ({ invoiceId, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/invoices/${invoiceId}/payments/manual`, payload);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to add payment");
    }
  }
);

export const generateSchoolInvoice = createAsyncThunk(
  "superAdminBilling/generateSchoolInvoice",
  async ({ schoolId, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/invoices`, payload || {});
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to generate invoice");
    }
  }
);

export const assignSchoolPlan = createAsyncThunk(
  "superAdminBilling/assignSchoolPlan",
  async ({ schoolId, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/assign-plan`, payload);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to assign plan");
    }
  }
);

export const fetchSchoolSubscription = createAsyncThunk(
  "superAdminBilling/fetchSchoolSubscription",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/super-admin/billing/schools/${schoolId}/subscription`);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch subscription");
    }
  }
);

export const renewSchoolSubscription = createAsyncThunk(
  "superAdminBilling/renewSchoolSubscription",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/renew`);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to renew subscription");
    }
  }
);

export const cancelSchoolSubscription = createAsyncThunk(
  "superAdminBilling/cancelSchoolSubscription",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/cancel`);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to cancel subscription");
    }
  }
);

export const suspendSchoolSubscription = createAsyncThunk(
  "superAdminBilling/suspendSchoolSubscription",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/suspend`);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to suspend subscription");
    }
  }
);

export const reactivateSchoolSubscription = createAsyncThunk(
  "superAdminBilling/reactivateSchoolSubscription",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/reactivate`);
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to reactivate subscription");
    }
  }
);

export const changeSchoolPlan = createAsyncThunk(
  "superAdminBilling/changeSchoolPlan",
  async ({ schoolId, planId, action }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/schools/${schoolId}/change-plan`, { planId, action });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to change plan");
    }
  }
);

export const createRazorpayOrder = createAsyncThunk(
  "superAdminBilling/createRazorpayOrder",
  async ({ invoiceId, gatewayProvider = "razorpay" }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/invoices/${invoiceId}/payments/gateway-intent`, { gatewayProvider });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to create payment order");
    }
  }
);

export const verifyRazorpayPayment = createAsyncThunk(
  "superAdminBilling/verifyRazorpayPayment",
  async ({ invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/super-admin/billing/invoices/${invoiceId}/payments/verify`, {
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
      });
      return res.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Payment verification failed");
    }
  }
);

const initialState = {
  invoices: [],
  payments: [],
  revenueSummary: {},
  schoolSubscription: null,
  razorpayOrder: null,
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

const superAdminBillingSlice = createSlice({
  name: "superAdminBilling",
  initialState,
  reducers: {
    clearBillingMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBillingInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillingInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchBillingInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBillingPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBillingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchBillingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRevenueSummary.fulfilled, (state, action) => {
        state.revenueSummary = action.payload;
      })
      .addCase(addManualSubscriptionPayment.fulfilled, (state) => {
        state.successMessage = "Payment added successfully";
      })
      .addCase(generateSchoolInvoice.fulfilled, (state) => {
        state.successMessage = "Invoice generated successfully";
      })
      .addCase(assignSchoolPlan.fulfilled, (state) => {
        state.successMessage = "Plan assigned successfully";
      })
      .addCase(fetchSchoolSubscription.pending, (state) => { state.actionLoading = true; })
      .addCase(fetchSchoolSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = action.payload;
      })
      .addCase(fetchSchoolSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = null;
        state.error = action.payload;
      })
      .addCase(renewSchoolSubscription.pending, (state) => { state.actionLoading = true; })
      .addCase(renewSchoolSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = action.payload;
        state.successMessage = "Subscription renewed successfully";
      })
      .addCase(renewSchoolSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(cancelSchoolSubscription.pending, (state) => { state.actionLoading = true; })
      .addCase(cancelSchoolSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = action.payload;
        state.successMessage = "Subscription cancelled";
      })
      .addCase(cancelSchoolSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(suspendSchoolSubscription.pending, (state) => { state.actionLoading = true; })
      .addCase(suspendSchoolSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = action.payload;
        state.successMessage = "Subscription suspended";
      })
      .addCase(suspendSchoolSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(reactivateSchoolSubscription.pending, (state) => { state.actionLoading = true; })
      .addCase(reactivateSchoolSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = action.payload;
        state.successMessage = "Subscription reactivated";
      })
      .addCase(reactivateSchoolSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(changeSchoolPlan.pending, (state) => { state.actionLoading = true; })
      .addCase(changeSchoolPlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.schoolSubscription = action.payload;
        state.successMessage = "Plan changed successfully";
      })
      .addCase(changeSchoolPlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(createRazorpayOrder.pending, (state) => { state.actionLoading = true; })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.razorpayOrder = action.payload;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(verifyRazorpayPayment.pending, (state) => { state.actionLoading = true; })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.actionLoading = false;
        state.successMessage = "Payment successful! Invoice marked as paid.";
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBillingMessages } = superAdminBillingSlice.actions;
export default superAdminBillingSlice.reducer;

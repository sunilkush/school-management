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

const initialState = {
  invoices: [],
  payments: [],
  revenueSummary: {},
  loading: false,
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
      });
  },
});

export const { clearBillingMessages } = superAdminBillingSlice.actions;
export default superAdminBillingSlice.reducer;

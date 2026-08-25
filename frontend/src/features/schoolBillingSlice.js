// features/schoolBillingSlice.js — School Admin's own self-serve SaaS billing (pay the
// platform for this school's subscription). Distinct from studentFeeSlice/paymentSlice, which
// are the Parent-pays-School side — these two payment systems stay deliberately separate.
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const getApiMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.message || fallback;

export const fetchMySubscription = createAsyncThunk(
  "schoolBilling/fetchMySubscription",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/school-billing/subscription");
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiMessage(err, "Failed to fetch subscription"));
    }
  }
);

export const fetchMyInvoices = createAsyncThunk(
  "schoolBilling/fetchMyInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/school-billing/invoices");
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiMessage(err, "Failed to fetch invoices"));
    }
  }
);

export const createMyPaymentIntent = createAsyncThunk(
  "schoolBilling/createMyPaymentIntent",
  async (invoiceId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/school-billing/invoices/${invoiceId}/pay/intent`);
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiMessage(err, "Failed to start payment"));
    }
  }
);

export const verifyMyPayment = createAsyncThunk(
  "schoolBilling/verifyMyPayment",
  async ({ invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/school-billing/invoices/${invoiceId}/pay/verify`, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(getApiMessage(err, "Payment verification failed"));
    }
  }
);

const schoolBillingSlice = createSlice({
  name: "schoolBilling",
  initialState: {
    subscription: null,
    invoices: [],
    loading: false,
    paying: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySubscription.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMySubscription.fulfilled, (state, action) => { state.loading = false; state.subscription = action.payload; })
      .addCase(fetchMySubscription.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMyInvoices.pending, (state) => { state.loading = true; })
      .addCase(fetchMyInvoices.fulfilled, (state, action) => { state.loading = false; state.invoices = action.payload || []; })
      .addCase(fetchMyInvoices.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createMyPaymentIntent.pending, (state) => { state.paying = true; })
      .addCase(createMyPaymentIntent.fulfilled, (state) => { state.paying = false; })
      .addCase(createMyPaymentIntent.rejected, (state, action) => { state.paying = false; state.error = action.payload; })

      .addCase(verifyMyPayment.pending, (state) => { state.paying = true; })
      .addCase(verifyMyPayment.fulfilled, (state) => { state.paying = false; })
      .addCase(verifyMyPayment.rejected, (state, action) => { state.paying = false; state.error = action.payload; });
  },
});

export default schoolBillingSlice.reducer;

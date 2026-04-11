import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ============================
   ASYNC THUNKS
============================ */

// ✅ Create Payment
export const createPayment = createAsyncThunk(
    "payment/create",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                `/payments`,
                payload,
                {
                    headers: {
                    }
                }
            );
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Payment creation failed"
            );
        }
    }
);

// ✅ Get All Payments
export const fetchPayments = createAsyncThunk(
    "payment/fetchAll",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(`/payments`, {
                headers: {
                },
                params,
            });
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch payments"
            );
        }
    }
);

// ✅ Get Payment By ID
export const fetchPaymentById = createAsyncThunk(
    "payment/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(
                `/payments/${id}`,
                {
                    headers: {
                    },
                }
            );
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch payment"
            );
        }
    }
);

// ✅ Payment Summary
export const fetchPaymentSummary = createAsyncThunk(
    "payment/summary",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(
                `/payments/summary`,
                {

                    params,
                },
                {
                    headers: {
                    }
                }
            );
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch summary"
            );
        }
    }
);

/* ============================
   SLICE
============================ */

const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        payments: [],
        payment: null,
        summary: null,
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        resetPaymentState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder

            // CREATE
            .addCase(createPayment.pending, (state) => {
                state.loading = true;
            })
            .addCase(createPayment.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.payments.unshift(action.payload?.data);
            })
            .addCase(createPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // GET ALL
            .addCase(fetchPayments.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPayments.fulfilled, (state, action) => {
                state.loading = false;
                state.payments = action.payload?.data || [];
            })
            .addCase(fetchPayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // GET BY ID
            .addCase(fetchPaymentById.fulfilled, (state, action) => {
                state.payment = action.payload?.data;
            })

            // SUMMARY
            .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
                state.summary = action.payload?.data;
            });
    },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;

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

// ✅ Refund a payment (full or partial)
export const refundPayment = createAsyncThunk(
    "payment/refund",
    async ({ paymentId, ...body }, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(`/payments/${paymentId}/refund`, body);
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Refund failed"
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
        refundLoading: false,
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
                // A captured payment returns { payment, studentFee }; a razorpay order-creation
                // call (no gateway response yet) returns { orderId, amount, currency, keyId }
                // instead — only the former has an actual Payment doc to add to local state.
                const createdPayment = action.payload?.data?.payment;
                if (createdPayment?._id) {
                    state.payments.unshift(createdPayment);
                }
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
            })

            // REFUND
            .addCase(refundPayment.pending, (state) => {
                state.refundLoading = true;
            })
            .addCase(refundPayment.fulfilled, (state, action) => {
                state.refundLoading = false;
                const updatedPayment = action.payload?.data?.payment;
                if (updatedPayment?._id) {
                    const idx = state.payments.findIndex((p) => p._id === updatedPayment._id);
                    if (idx !== -1) {
                        state.payments[idx] = { ...state.payments[idx], ...updatedPayment };
                    }
                }
            })
            .addCase(refundPayment.rejected, (state, action) => {
                state.refundLoading = false;
                state.error = action.payload;
            });
    },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;

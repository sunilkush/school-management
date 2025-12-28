import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* ================= CREATE ================= */
export const createFeeStructure = createAsyncThunk(
    "feeStructure/create",
    async (data, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`${API_BASE_URL}/fee-structures`, data, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Failed to create fee structure"
            );
        }
    }
);

/* ================= GET ALL ================= */
export const fetchFeeStructures = createAsyncThunk(
    "feeStructure/getAll",
    async (params, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/fee-structures`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                params
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Failed to fetch fee structures"
            );
        }
    }
);

/* ================= UPDATE ================= */
export const updateFeeStructure = createAsyncThunk(
    "feeStructure/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(`${API_BASE_URL}/fee-structures/${id}`, data, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Failed to update fee structure"
            );
        }
    }
);

/* ================= DELETE ================= */
export const deleteFeeStructure = createAsyncThunk(
    "feeStructure/delete",
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${API_BASE_URL}/fee-structures/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            return id;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Failed to delete fee structure"
            );
        }
    }
);

/* ================= SLICE ================= */
const feeStructureSlice = createSlice({
    name: "feeStructure",
    initialState: {
        feeStructures: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder

            /* ===== CREATE ===== */
            .addCase(createFeeStructure.pending, (state) => {
                state.loading = true;
            })
            .addCase(createFeeStructure.fulfilled, (state, action) => {
                state.loading = false;
                state.feeStructures.push(action.payload);
            })
            .addCase(createFeeStructure.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== GET ===== */
            .addCase(fetchFeeStructures.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchFeeStructures.fulfilled, (state, action) => {
                state.loading = false;
                state.feeStructures = action.payload;
            })
            .addCase(fetchFeeStructures.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== UPDATE ===== */
            .addCase(updateFeeStructure.fulfilled, (state, action) => {
                const index = state.feeStructures.findIndex(
                    (f) => f._id === action.payload._id
                );
                if (index !== -1) {
                    state.feeStructures[index] = action.payload;
                }
            })

            /* ===== DELETE ===== */
            .addCase(deleteFeeStructure.fulfilled, (state, action) => {
                state.feeStructures = state.feeStructures.filter(
                    (f) => f._id !== action.payload
                );
            });
    },
});

export default feeStructureSlice.reducer;

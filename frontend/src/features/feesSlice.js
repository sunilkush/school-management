import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem('accessToken');
/* ===============================
   FETCH ALL FEES
================================ */
export const fetchAllFees = createAsyncThunk(
    "fees/fetchAll",
    async (params, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/fees/allFees`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                },
                { params });
            return res.data.data; // ✅ API format ke according
        } catch (e) {
            return rejectWithValue(e.response?.data || "Failed to load fees");
        }
    }
);


/* ===============================
   CREATE FEE
================================ */
export const createFee = createAsyncThunk(
    "fees/create",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/fees/createFees`, payload,
                {
                    headers: { Authorization: `Bearer ${token}` }
                },
            );
            return res.data;      // ✅ single created fee
        } catch (e) {
            return rejectWithValue(e.response?.data || "Failed to create fee");
        }
    }
);


/* ===============================
   DELETE FEE
================================ */
export const deleteFees = createAsyncThunk(
    "fees/delete",
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_BASE_URL}/fees/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                },
            );
            return id;
        } catch (e) {
            return rejectWithValue(e.response?.data || "Delete failed");
        }
    }
);


/* ===============================
      SLICE
================================ */
const feesSlice = createSlice({
    name: "fees",

    initialState: {
        feesList: [],
        loading: false,
        error: null,
    },

    reducers: {},

    extraReducers: (builder) => {
        builder

            /* FETCH */
            .addCase(fetchAllFees.pending, (s) => {
                s.loading = true;
            })
            .addCase(fetchAllFees.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.feesList = payload;
            })
            .addCase(fetchAllFees.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            })

            /* CREATE */
            .addCase(createFee.pending, (s) => {
                s.loading = true;
            })
            .addCase(createFee.fulfilled, (s, { payload }) => {
                s.loading = false;

                // ✅ Add new fee to top of list
                s.feesList.unshift(payload);
            })
            .addCase(createFee.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            })

            /* DELETE */
            .addCase(deleteFees.fulfilled, (s, { payload }) => {
                s.feesList = s.feesList.filter(
                    (f) => f._id !== payload
                );
            });
    },
});
// eslint-disable-next-line no-empty-pattern
export const { } = feesSlice.actions;
export default feesSlice.reducer;


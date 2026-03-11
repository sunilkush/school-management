import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const ApiUrl = import.meta.env.VITE_API_URL;

/* ================= CREATE BOARD CLASS ================= */

export const createBoardClass = createAsyncThunk(
    "boardClass/createBoardClass",
    async (boardClass, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.post(
                `${ApiUrl}/board-class`,
                boardClass,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return res.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Create failed"
            );
        }
    }
);

/* ================= GET BOARD CLASS ================= */

export const getBoardClass = createAsyncThunk(
    "boardClass/getBoardClass",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.get(`${ApiUrl}/board-class`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return res.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Data Fetch Failed!"
            );
        }
    }
);

/* =========== UPDATE CLASS ============== */
export const updateBoardClass = createAsyncThunk(
    "boardClass/updateBoardClass",
    async (id, { rejectWithValue }) => {

        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(`${ApiUrl}/`, id, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return res.data
        } catch (error) {
            return rejectWithValue(error.response.data.message || "Update Class")
        }
    }
)
/* ================= INITIAL STATE ================= */

const initialState = {
    loading: false,
    error: null,
    success: false,
    boardClass: [],
};

/* ================= SLICE ================= */

const boardClassSlice = createSlice({
    name: "boardClass",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            /* ===== CREATE CLASS ===== */

            .addCase(createBoardClass.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })

            .addCase(createBoardClass.fulfilled, (state, action) => {
                state.loading = false;
                state.boardClass.push(action.payload);
                state.success = true;
            })

            .addCase(createBoardClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            /* ===== GET CLASS ===== */

            .addCase(getBoardClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getBoardClass.fulfilled, (state, action) => {
                state.loading = false;
                state.boardClass = action.payload;
                state.success = true;
            })

            .addCase(getBoardClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ====== update class ======= */

            .addCase(updateBoardClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(updateBoardClass.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                const updatedClass = action.payload;

                const index = state.boardClass.findIndex(
                    (item) => item._id === updatedClass._id
                );

                if (index !== -1) {
                    state.boardClass[index] = updatedClass;
                }
            })

            .addCase(updateBoardClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

    },
});

export default boardClassSlice.reducer;
import { createAsyncThunk,createSlice } from "@reduxjs/toolkit";
import axios from "axios";
const api = "http://localhost:9000/app/v1/class";
// Create a new class
export const fetchAllClasses = createAsyncThunk(
    "class/fetchAllClasses",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${api}/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Failed to fetch classes!"
            );
        }
    }
);

export const createClass = createAsyncThunk(
    "class/createClass",
    async (classData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`${api}/create`, classData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Class creation failed!"
            );
        }
    }
);

const initialState = {
    loading: false,
    error: null,
    classList: [],
    success: false,
};

const classSlice = createSlice({
    name: "class",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllClasses.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(fetchAllClasses.fulfilled, (state, action) => {
                state.loading = false;
                state.classList = action.payload.data;
                state.success = true;
            })
            .addCase(fetchAllClasses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createClass.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action) => {
                state.loading = false;
                state.classList.push(action.payload.data);
                state.success = true;
            })
            .addCase(createClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
})
// eslint-disable-next-line no-empty-pattern
export const {} = classSlice.actions;
export default classSlice.reducer;
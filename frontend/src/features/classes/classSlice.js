import { createAsyncThunk,createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL
// Create a new class
export const fetchAllClasses = createAsyncThunk(
    "class/fetchAllClasses",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${Api_Base_Url}/class/allClasses`, {
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
            const res = await axios.post(`${Api_Base_Url}/class/create`, classData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Class created successfully:", res.data);
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
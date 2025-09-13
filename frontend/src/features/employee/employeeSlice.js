import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const Api_Base_Url = import.meta.env.VITE_API_URL
export const createEmployee = createAsyncThunk(
    "employee/createEmployee",
    async (formData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken")
            const res = await axios.post(
                `${Api_Base_Url}/employee`,
                formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
            );
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
);

const employeeSlice = createSlice({
    name: "employee",
    initialState: {
        loading: false,
        error: null,
        success: false,
        response: null,
    },
    reducers: {
        resetEmployeeState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.response = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
                state.response = null;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.response = action.payload;
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = action.payload;
            });
    },
});

export const { resetEmployeeState } = employeeSlice.actions;
export default employeeSlice.reducer;

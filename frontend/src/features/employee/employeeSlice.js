import { createAsyncThunk,createSlice } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const createEmployee = createAsyncThunk(
    "employee/createEmployee", async (employeeData, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/employee`, employeeData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            return res.data;
        }
        catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const employeeSlice = createSlice({
    name: "employee",
    initialState: {
        employees: [],
        loading: false,
        error: null,
        success: null,
        employee: null
    },
    reducers: {
        clearState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = null;
            state.employee = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Employee
            .addCase(createEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = null;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Employee created successfully";
                state.employees.push(action.payload);
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to create employee";
            });
        }
})

export const { clearState } = employeeSlice.actions;
export default employeeSlice.reducer;
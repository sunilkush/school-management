import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const createEmployee = createAsyncThunk(
    "employee/createEmployee",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/employee", formData);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
);

export const getEmployees = createAsyncThunk(
    "employee/getEmployees",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/employee", { params });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
);

export const updateEmployee = createAsyncThunk(
    "employee/updateEmployee",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const res = await apiClient.put(`/employee/updateEmployee/${id}`, payload);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
);

export const softDeleteEmployee = createAsyncThunk(
    "employee/softDeleteEmployee",
    async (id, { rejectWithValue }) => {
        try {
            const res = await apiClient.delete(`/employee/deleteEmployee/${id}`);
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
        employees: [],
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
            // createEmployee
            .addCase(createEmployee.pending, (state) => {
                state.loading = true; state.error = null;
                state.success = false; state.response = null;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.loading = false; state.success = true;
                state.response = action.payload;
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.loading = false; state.success = false;
                state.error = action.payload;
            })
            // getEmployees
            .addCase(getEmployees.pending, (state) => {
                state.loading = true; state.error = null;
            })
            .addCase(getEmployees.fulfilled, (state, action) => {
                state.loading = false;
                const raw = action.payload;
                const data = raw?.data || raw?.employees || raw;
                state.employees = Array.isArray(data) ? data : [];
            })
            .addCase(getEmployees.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            })
            // updateEmployee
            .addCase(updateEmployee.pending, (state) => {
                state.loading = true; state.error = null;
            })
            .addCase(updateEmployee.fulfilled, (state) => {
                state.loading = false; state.success = true;
            })
            .addCase(updateEmployee.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            })
            // softDeleteEmployee
            .addCase(softDeleteEmployee.pending, (state) => {
                state.loading = true; state.error = null;
            })
            .addCase(softDeleteEmployee.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(softDeleteEmployee.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            });
    },
});

export const { resetEmployeeState } = employeeSlice.actions;
export default employeeSlice.reducer;

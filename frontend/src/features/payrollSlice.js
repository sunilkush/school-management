import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const getErrorPayload = (error, fallback) => ({
  message: error?.response?.data?.message || fallback,
  status: error?.response?.status || null,
});

export const fetchPayrollStructures = createAsyncThunk("payroll/fetchStructures", async (_, { rejectWithValue }) => {
  try {
    const response = await httpClient.get("/payroll/structure");
    return response?.data?.data || [];
  } catch (error) {
    return rejectWithValue(getErrorPayload(error, "Structure listing failed"));
  }
});

export const fetchPayrollEmployees = createAsyncThunk("payroll/fetchEmployees", async (_, { rejectWithValue }) => {
  try {
    const response = await httpClient.get("/employee");
    return response?.data?.data || [];
  } catch (error) {
    return rejectWithValue(getErrorPayload(error, "Employee list load failed"));
  }
});

export const savePayrollStructure = createAsyncThunk(
  "payroll/saveStructure",
  async ({ editingId, payload }, { rejectWithValue }) => {
    try {
      if (editingId) {
        await httpClient.put(`/payroll/structure/${editingId}`, payload);
        return { message: "Salary structure updated" };
      }
      await httpClient.post("/payroll/structure", payload);
      return { message: "Salary structure created" };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error, "Salary structure save failed"));
    }
  }
);

const payrollSlice = createSlice({
  name: "payroll",
  initialState: {
    loadingStructures: false,
    loadingEmployees: false,
    savingStructure: false,
    structures: [],
    employees: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollStructures.pending, (state) => {
        state.loadingStructures = true;
        state.error = null;
      })
      .addCase(fetchPayrollStructures.fulfilled, (state, action) => {
        state.loadingStructures = false;
        state.structures = action.payload;
      })
      .addCase(fetchPayrollStructures.rejected, (state, action) => {
        state.loadingStructures = false;
        state.error = action.payload?.message || "Structure listing failed";
        state.structures = [];
      })
      .addCase(fetchPayrollEmployees.pending, (state) => {
        state.loadingEmployees = true;
        state.error = null;
      })
      .addCase(fetchPayrollEmployees.fulfilled, (state, action) => {
        state.loadingEmployees = false;
        state.employees = action.payload;
      })
      .addCase(fetchPayrollEmployees.rejected, (state, action) => {
        state.loadingEmployees = false;
        state.error = action.payload?.message || "Employee list load failed";
      })
      .addCase(savePayrollStructure.pending, (state) => {
        state.savingStructure = true;
        state.error = null;
      })
      .addCase(savePayrollStructure.fulfilled, (state) => {
        state.savingStructure = false;
      })
      .addCase(savePayrollStructure.rejected, (state, action) => {
        state.savingStructure = false;
        state.error = action.payload?.message || "Salary structure save failed";
      });
  },
});

export default payrollSlice.reducer;

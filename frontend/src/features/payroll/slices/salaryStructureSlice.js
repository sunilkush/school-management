import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildPayrollScope, payrollApi } from "../services/payrollApi";
import { createPayrollEntitySlice } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "salaryStructures", api: payrollApi.salaryStructures });
export const approveSalaryStructure = createAsyncThunk("salaryStructures/approve", async (id, { getState, rejectWithValue }) => { try { return await payrollApi.salaryStructures.approve(id, {}, buildPayrollScope(getState())); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const { fetchAll: fetchSalaryStructures, createOne: createSalaryStructure, updateOne: updateSalaryStructure } = entity.thunks;
export default entity.reducer;

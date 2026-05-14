import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildPayrollScope, payrollApi } from "../services/payrollApi";
import { createPayrollEntitySlice } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "payrollCycles", api: payrollApi.cycles });
export const lockPayrollCycle = createAsyncThunk("payrollCycles/lock", async (id, { getState, rejectWithValue }) => { try { return await payrollApi.cycles.lock(id, buildPayrollScope(getState())); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const { fetchAll: fetchPayrollCycles, createOne: createPayrollCycle, updateOne: updatePayrollCycle } = entity.thunks;
export default entity.reducer;

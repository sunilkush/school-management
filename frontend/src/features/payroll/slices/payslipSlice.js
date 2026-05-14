import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildPayrollScope, payrollApi } from "../services/payrollApi";
import { createPayrollEntitySlice } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "payslips", api: payrollApi.payslips });
export const fetchPayslips = entity.thunks.fetchAll;
export const fetchMyPayslips = createAsyncThunk("payslips/fetchMine", async (_, { getState, rejectWithValue }) => { try { return await payrollApi.payslips.mine(buildPayrollScope(getState())); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const generatePayslips = createAsyncThunk("payslips/generate", async (cycleId, { getState, rejectWithValue }) => { try { return await payrollApi.payslips.generate(cycleId, buildPayrollScope(getState())); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const publishPayslips = createAsyncThunk("payslips/publish", async (cycleId, { getState, rejectWithValue }) => { try { return await payrollApi.payslips.publish(cycleId, buildPayrollScope(getState())); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export default entity.reducer;

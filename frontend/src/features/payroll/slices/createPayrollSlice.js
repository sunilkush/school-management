import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { buildPayrollScope, payrollApi } from "../services/payrollApi";

export const createPayrollEntitySlice = ({ name, api }) => {
  const fetchAll = createAsyncThunk(`${name}/fetchAll`, async (arg = {}, { getState, rejectWithValue }) => {
    try {
      return await api.list({ ...buildPayrollScope(getState()), ...arg });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const createOne = createAsyncThunk(`${name}/createOne`, async (payload = {}, { getState, rejectWithValue }) => {
    try {
      return await (api.create || api.save)(payload, buildPayrollScope(getState()));
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const updateOne = createAsyncThunk(`${name}/updateOne`, async ({ id, data } = {}, { getState, rejectWithValue }) => {
    try {
      return await api.update(id, data, buildPayrollScope(getState()));
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const removeOne = createAsyncThunk(`${name}/removeOne`, async (id, { getState, rejectWithValue }) => {
    try {
      return await api.remove(id, buildPayrollScope(getState()));
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const slice = createSlice({
    name,
    initialState: { items: [], current: null, loading: false, error: null, successMessage: null },
    reducers: {
      clearPayrollState: (state) => { state.error = null; state.successMessage = null; },
      setCurrent: (state, action) => { state.current = action.payload; },
    },
    extraReducers: (builder) => {
      const pending = (state) => { state.loading = true; state.error = null; };
      const rejected = (state, action) => { state.loading = false; state.error = action.payload || "Payroll request failed"; };
      builder
        .addCase(fetchAll.pending, pending).addCase(fetchAll.fulfilled, (state, action) => { state.loading = false; state.items = Array.isArray(action.payload) ? action.payload : action.payload ? [action.payload] : []; }).addCase(fetchAll.rejected, rejected)
        .addCase(createOne.pending, pending).addCase(createOne.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; state.successMessage = "Saved successfully"; }).addCase(createOne.rejected, rejected)
        .addCase(updateOne.pending, pending).addCase(updateOne.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; state.items = state.items.map((item) => item._id === action.payload?._id ? action.payload : item); state.successMessage = "Updated successfully"; }).addCase(updateOne.rejected, rejected)
        .addCase(removeOne.pending, pending).addCase(removeOne.fulfilled, (state, action) => { state.loading = false; state.items = state.items.map((item) => item._id === action.payload?._id ? action.payload : item); state.successMessage = "Updated successfully"; }).addCase(removeOne.rejected, rejected);
    },
  });
  return { reducer: slice.reducer, actions: slice.actions, thunks: { fetchAll, createOne, updateOne, removeOne } };
};

export { payrollApi };

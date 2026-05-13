import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpClient from "../api/httpClient";

const normalizeList = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  return data ? [data] : [];
};

export const createPayrollResourceSlice = ({ name, endpoint, idKey = "_id" }) => {
  const fetchAll = createAsyncThunk(`${name}/fetchAll`, async (params = {}, { rejectWithValue }) => {
    try {
      const res = await httpClient.get(endpoint, { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Request failed");
    }
  });

  const createOne = createAsyncThunk(`${name}/createOne`, async (payload = {}, { rejectWithValue }) => {
    try {
      const res = await httpClient.post(endpoint, payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Request failed");
    }
  });

  const updateOne = createAsyncThunk(`${name}/updateOne`, async ({ id, data, actionPath = "" }, { rejectWithValue }) => {
    try {
      const method = actionPath ? "patch" : "put";
      const res = await httpClient[method](`${endpoint}/${id}${actionPath}`, data || {});
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Request failed");
    }
  });

  const deleteOne = createAsyncThunk(`${name}/deleteOne`, async (id, { rejectWithValue }) => {
    try {
      await httpClient.delete(`${endpoint}/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Request failed");
    }
  });

  const slice = createSlice({
    name,
    initialState: { items: [], selected: null, loading: false, error: null, lastMessage: null },
    reducers: {
      clearPayrollState: (state) => {
        state.items = [];
        state.selected = null;
        state.error = null;
        state.lastMessage = null;
      },
      setSelectedPayrollRecord: (state, action) => {
        state.selected = action.payload || null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchAll.pending, (state) => { state.loading = true; state.error = null; })
        .addCase(fetchAll.fulfilled, (state, action) => { state.loading = false; state.items = normalizeList(action.payload); state.selected = action.payload?.data && !Array.isArray(action.payload.data) ? action.payload.data : state.selected; state.lastMessage = action.payload?.message || null; })
        .addCase(fetchAll.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.items = []; })
        .addCase(createOne.pending, (state) => { state.loading = true; state.error = null; })
        .addCase(createOne.fulfilled, (state, action) => { state.loading = false; const record = action.payload?.data; if (record) state.items.unshift(record); state.selected = record || state.selected; state.lastMessage = action.payload?.message || null; })
        .addCase(createOne.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
        .addCase(updateOne.pending, (state) => { state.loading = true; state.error = null; })
        .addCase(updateOne.fulfilled, (state, action) => { state.loading = false; const record = action.payload?.data; if (record?.[idKey]) state.items = state.items.map((item) => item?.[idKey] === record[idKey] ? record : item); state.selected = record || state.selected; state.lastMessage = action.payload?.message || null; })
        .addCase(updateOne.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
        .addCase(deleteOne.fulfilled, (state, action) => { state.items = state.items.filter((item) => item?.[idKey] !== action.payload); });
    },
  });

  return { reducer: slice.reducer, actions: slice.actions, thunks: { fetchAll, createOne, updateOne, deleteOne } };
};

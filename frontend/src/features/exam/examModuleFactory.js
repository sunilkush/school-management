import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/httpClient";

export const createCrudSlice = ({ name, basePath }) => {
  const list = createAsyncThunk(`${name}/list`, async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await apiClient.get(query ? `${basePath}?${query}` : basePath);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const getById = createAsyncThunk(`${name}/getById`, async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`${basePath}/${id}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const createOne = createAsyncThunk(`${name}/create`, async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(basePath, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const updateOne = createAsyncThunk(`${name}/update`, async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`${basePath}/${id}`, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const deleteOne = createAsyncThunk(`${name}/delete`, async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`${basePath}/${id}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

  const slice = createSlice({
    name,
    initialState: { loading: false, error: null, success: false, list: [], detail: null, meta: null },
    reducers: {
      clearError: (state) => { state.error = null; },
      clearDetail: (state) => { state.detail = null; },
      resetSuccess: (state) => { state.success = false; },
    },
    extraReducers: (builder) => {
      [list, getById, createOne, updateOne, deleteOne].forEach((thunk) => {
        builder.addCase(thunk.pending, (state) => { state.loading = true; state.error = null; state.success = false; });
        builder.addCase(thunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
      });
      builder
        .addCase(list.fulfilled, (state, action) => {
          state.loading = false;
          state.list = action.payload?.items || action.payload?.questions || action.payload || [];
          state.meta = action.payload?.pagination || null;
          state.success = true;
        })
        .addCase(getById.fulfilled, (state, action) => { state.loading = false; state.detail = action.payload; state.success = true; })
        .addCase(createOne.fulfilled, (state, action) => { state.loading = false; state.list.unshift(action.payload); state.success = true; })
        .addCase(updateOne.fulfilled, (state, action) => {
          state.loading = false;
          const idx = state.list.findIndex((item) => item._id === action.payload._id);
          if (idx >= 0) state.list[idx] = action.payload;
          state.detail = action.payload;
          state.success = true;
        })
        .addCase(deleteOne.fulfilled, (state, action) => {
          state.loading = false;
          const deletedId = action.payload?._id || action.meta.arg;
          state.list = state.list.filter((item) => item._id !== deletedId);
          state.success = true;
        });
    },
  });

  return { slice, actions: { list, getById, createOne, updateOne, deleteOne } };
};

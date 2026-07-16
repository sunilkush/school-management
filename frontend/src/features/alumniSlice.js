import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const markAsAlumni = createAsyncThunk(
  "alumni/markAsAlumni",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/alumni/mark", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAlumni = createAsyncThunk(
  "alumni/getAlumni",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/alumni?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAlumniProfile = createAsyncThunk(
  "alumni/updateAlumniProfile",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/alumni/${id}`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  alumni: [],
  pagination: null,
  loading: false,
  error: null,
};

const alumniSlice = createSlice({
  name: "alumni",
  initialState,
  reducers: {
    clearAlumniError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(markAsAlumni.fulfilled, (state, action) => {
        state.alumni.unshift(action.payload);
      })
      .addCase(markAsAlumni.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(getAlumni.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAlumni.fulfilled, (state, action) => {
        state.loading = false;
        state.alumni = action.payload?.alumni || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(getAlumni.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAlumniProfile.fulfilled, (state, action) => {
        const updated = action.payload;
        state.alumni = state.alumni.map((a) => (a._id === updated._id ? updated : a));
      })
      .addCase(updateAlumniProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearAlumniError } = alumniSlice.actions;
export default alumniSlice.reducer;

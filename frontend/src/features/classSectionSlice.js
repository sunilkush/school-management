import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Fetch all class-section mappings (optionally filtered by classId)
export const fetchClassSections = createAsyncThunk(
  "classSection/fetch",
  async ({ classId, schoolId, academicYearId } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = {};
      if (classId) params.classId = classId;
      if (schoolId) params.schoolId = schoolId;
      if (academicYearId) params.academicYearId = academicYearId;

      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`${API_URL}/classSection?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create new Class-Section mapping with subjects
export const createClassSection = createAsyncThunk(
  "classSection/create",
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${API_URL}/classSection`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update Class-Section mapping
export const updateClassSection = createAsyncThunk(
  "classSection/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${API_URL}/classSection/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete Class-Section mapping
export const deleteClassSection = createAsyncThunk(
  "classSection/delete",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_URL}/classSection/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id; // return deleted id to remove from state
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const slice = createSlice({
  name: "classSection",
  initialState: {
    loading: false,
    error: null,
    mappings: [],
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchClassSections.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClassSections.fulfilled, (state, action) => {
        state.loading = false;
        state.mappings = action.payload;
      })
      .addCase(fetchClassSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create
      .addCase(createClassSection.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createClassSection.fulfilled, (state, action) => {
        state.loading = false;
        state.mappings.push(action.payload);
      })
      .addCase(createClassSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // update
      .addCase(updateClassSection.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateClassSection.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.mappings.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) state.mappings[index] = action.payload;
      })
      .addCase(updateClassSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // delete
      .addCase(deleteClassSection.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteClassSection.fulfilled, (state, action) => {
        state.loading = false;
        state.mappings = state.mappings.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteClassSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = slice.actions;
export default slice.reducer;

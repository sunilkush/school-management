import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("accessToken");

// fetch sections mapped to a class
export const fetchClassSections = createAsyncThunk(
  "classSection/fetch",
  async (classId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/classSection/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data; // array of mapped sections
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// create new mapping
export const createClassSection = createAsyncThunk(
  "classSection/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/classSection`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassSections.pending, (state) => { state.loading = true; })
      .addCase(fetchClassSections.fulfilled, (state, action) => {
        state.loading = false;
        state.mappings = action.payload;
      })
      .addCase(fetchClassSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createClassSection.fulfilled, (state, action) => {
        state.mappings.push(action.payload);
      });
  },
});

export default slice.reducer;


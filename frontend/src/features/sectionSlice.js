import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// 🔹 Thunk: fetch sections
export const fetchSection = createAsyncThunk(
  "section/fetchSection",
  async ({ schoolId, classId, academicYearId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      // Build query params dynamically
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId);
      if (classId) params.append("classId", classId);
      if (academicYearId) params.append("academicYearId", academicYearId);

      const res = await axios.get(`${Api_Base_Url}/section?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Check your backend response structure
      // return res.data if backend returns array directly
      // return res.data.data if using ApiResponse wrapper
      return res.data.data || res.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch sections"
      );
    }
  }
);


// 🔹 Thunk: create section
export const createSection = createAsyncThunk(
  "section/createSection",
  async (sectionData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.post(`${Api_Base_Url}/section`, sectionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return res.data; // backend check: res.data ya res.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create section"
      );
    }
  }
);

const sectionSlice = createSlice({
  name: "section",
  initialState: {
    loading: false,
    error: null,
    sectionList: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSection.fulfilled, (state, action) => {
        state.loading = false;
        state.sectionList = action.payload?.data || action.payload || [];
      })
      .addCase(fetchSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.loading = false;
        state.sectionList.push(action.payload?.data || action.payload); // add new section
      })
      .addCase(createSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default sectionSlice.reducer;

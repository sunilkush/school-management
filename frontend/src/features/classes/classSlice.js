import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// CREATE class
export const createClass = createAsyncThunk(
  "class/createClass",
  async (classData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/class/create`, classData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Class created:", res.data);
      return res.data?.data || res.data; // safe return
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class creation failed!"
      );
    }
  }
);

// FETCH all classes
export const fetchAllClasses = createAsyncThunk(
  "class/fetchAllClasses",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${Api_Base_Url}/class/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Classes fetched:", res.data);
      return res.data?.data || []; // safe return
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch classes!"
      );
    }
  }
);

// DELETE class
export const deleteClass = createAsyncThunk(
  "class/deleteClass",
  async (classId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${Api_Base_Url}/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("🗑️ Class deleted:", classId);
      return classId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class deletion failed!"
      );
    }
  }
);

// UPDATE class
export const updateClass = createAsyncThunk(
  "class/updateClass",
  async ({ id, classData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${Api_Base_Url}/class/${id}`, classData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✏️ Class updated:", res.data);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Class update failed!"
      );
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  classList: [],
  success: false,
};

const classSlice = createSlice({
  name: "class",
  initialState,
  reducers: {
    resetClassState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchAllClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classList = action.payload || [];
      })
      .addCase(fetchAllClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.classList.push(action.payload);
        }
        state.success = true;
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classList = state.classList.filter(
          (cls) => cls._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        state.classList = state.classList.map((cls) =>
          cls._id === updated._id ? updated : cls
        );
        state.success = true;
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetClassState } = classSlice.actions;
export default classSlice.reducer;

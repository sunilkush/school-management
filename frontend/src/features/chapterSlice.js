import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


const Api_Base_Url = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("accessToken");

/* =====================================================
   🔧 AXIOS INSTANCE
===================================================== */

const api = axios.create({
  baseURL: Api_Base_Url,
  withCredentials: true,
});

/* =====================================================
   🚀 THUNKS
===================================================== */

// ⭐ Get Visible Chapters (MOST USED)
export const fetchVisibleChapters = createAsyncThunk(
  "chapters/fetchVisible",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/chapters/visible", { 
        params, 
        headers: { 
            Authorization: `Bearer ${getToken()}` 
        } 
    });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Get All Chapters (Super Admin)
export const fetchAllChapters = createAsyncThunk(
  "chapters/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/chapters/", { 
        params,
        headers: { Authorization: `Bearer ${getToken()}` } });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Get Single Chapter
export const fetchChapterById = createAsyncThunk(
  "chapters/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/chapters/${id}`,{
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Create Chapter
export const createChapterThunk = createAsyncThunk(
  "chapters/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/chapters/", payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Update Chapter
export const updateChapterThunk = createAsyncThunk(
  "chapters/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/chapters/${id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Delete Chapter
export const deleteChapterThunk = createAsyncThunk(
  "chapters/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/chapters/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// ⭐ Assign Chapter to School
export const assignChapterToSchoolThunk = createAsyncThunk(
  "chapters/assignSchool",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/chapters/assign-school", payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

/* =====================================================
   🧠 SLICE
===================================================== */

const chapterSlice = createSlice({
  name: "chapters",
  initialState: {
    chapters: [],
    selectedChapter: null,
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearChapterError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ================= FETCH VISIBLE ================= */
      .addCase(fetchVisibleChapters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVisibleChapters.fulfilled, (state, action) => {
        state.loading = false;
        state.chapters = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVisibleChapters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= FETCH ALL ================= */
      .addCase(fetchAllChapters.fulfilled, (state, action) => {
        state.chapters = action.payload.data;
        state.pagination = action.payload.pagination;
      })

      /* ================= FETCH BY ID ================= */
      .addCase(fetchChapterById.fulfilled, (state, action) => {
        state.selectedChapter = action.payload;
      })

      /* ================= CREATE ================= */
      .addCase(createChapterThunk.fulfilled, (state, action) => {
        state.chapters.unshift(action.payload);
      })

      /* ================= UPDATE ================= */
      .addCase(updateChapterThunk.fulfilled, (state, action) => {
        const index = state.chapters.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) state.chapters[index] = action.payload;
      })

      /* ================= DELETE ================= */
      .addCase(deleteChapterThunk.fulfilled, (state, action) => {
        state.chapters = state.chapters.filter(
          (c) => c._id !== action.payload
        );
      });
  },
});

export const { clearChapterError } = chapterSlice.actions;

export default chapterSlice.reducer;
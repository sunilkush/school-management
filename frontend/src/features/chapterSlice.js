import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("accessToken");

/* =====================================================
   🚀 THUNKS
===================================================== */

/* ================= FETCH VISIBLE ================= */
export const fetchVisibleChapters = createAsyncThunk(
  "chapters/fetchVisible",
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${Api_Base_Url}/chapters/visible`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Fetch visible chapters failed"
      );
    }
  }
);

/* ================= FETCH ALL ================= */
export const fetchAllChapters = createAsyncThunk(
  "chapters/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${Api_Base_Url}/chapters`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params,
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Fetch all chapters failed"
      );
    }
  }
);

/* ================= FETCH BY ID ================= */
export const fetchChapterById = createAsyncThunk(
  "chapters/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${Api_Base_Url}/chapters/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Fetch chapter failed"
      );
    }
  }
);

/* ================= CREATE ================= */
export const createChapterThunk = createAsyncThunk(
  "chapters/create",
  async (payload, { rejectWithValue }) => {
    try {
       const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/chapters`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Create chapter failed"
      );
    }
  }
);

/* ================= UPDATE ================= */
export const updateChapterThunk = createAsyncThunk(
  "chapters/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `${Api_Base_Url}/chapters/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
          withCredentials: true,
        }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Update chapter failed"
      );
    }
  }
);

/* ================= DELETE ================= */
export const deleteChapterThunk = createAsyncThunk(
  "chapters/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${Api_Base_Url}/chapters/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        withCredentials: true,
      });
      return { id, ...res.data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Delete chapter failed"
      );
    }
  }
);

/* ================= ASSIGN SCHOOL ================= */
export const assignChapterToSchoolThunk = createAsyncThunk(
  "chapters/assignSchool",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${Api_Base_Url}/chapters/assign-school`,
        payload,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
          withCredentials: true,
        }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Assign chapter failed"
      );
    }
  }
);

/* =====================================================
   🧠 SLICE
===================================================== */

const initialState = {
  chapters: [],
  selectedChapter: null,
  pagination: {},
  loading: false,
  error: null,
};

const chapterSlice = createSlice({
  name: "chapters",
  initialState,
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
        state.error = null;
      })
      .addCase(fetchVisibleChapters.fulfilled, (state, action) => {
        state.loading = false;
        state.chapters = action.payload?.data?.data || [];
        state.pagination = action.payload?.data?.pagination || {};
      })
      .addCase(fetchVisibleChapters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= FETCH ALL ================= */
      .addCase(fetchAllChapters.fulfilled, (state, action) => {
        state.chapters = action.payload?.data?.data || [];
        state.pagination = action.payload?.data?.pagination || {};
      })

      /* ================= FETCH BY ID ================= */
      .addCase(fetchChapterById.fulfilled, (state, action) => {
        state.selectedChapter = action.payload?.data || null;
      })

      /* ================= CREATE ================= */
      .addCase(createChapterThunk.fulfilled, (state, action) => {
        const newChapter = action.payload?.data;
        if (newChapter) state.chapters.unshift(newChapter);
      })

      /* ================= UPDATE ================= */
      .addCase(updateChapterThunk.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (!updated) return;

        const index = state.chapters.findIndex(
          (c) => c._id === updated._id
        );
        if (index !== -1) state.chapters[index] = updated;
      })

      /* ================= DELETE ================= */
      .addCase(deleteChapterThunk.fulfilled, (state, action) => {
        const deletedId = action.payload?.id;
        state.chapters = state.chapters.filter(
          (c) => c._id !== deletedId
        );
      })

      /* ================= ASSIGN SCHOOL ================= */
      .addCase(assignChapterToSchoolThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignChapterToSchoolThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(assignChapterToSchoolThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearChapterError } = chapterSlice.actions;
export default chapterSlice.reducer;
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/* ================= HELPERS ================= */
const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.boards)) return payload.data.boards;
  if (Array.isArray(payload?.data?.schoolBoards)) return payload.data.schoolBoards;
  return [];
};

const toMessage = (payload, fallback = "Something went wrong") => {
  if (typeof payload === "string") return payload;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.response?.data?.message === "string") {
    return payload.response.data.message;
  }
  return fallback;
};

/* ================= CREATE BOARD ================= */
export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async (boardData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/boards`, boardData);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Create failed" }
      );
    }
  }
);

/* ================= GET BOARDS ================= */
export const getBoards = createAsyncThunk(
  "boards/getBoards",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/boards`, { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Fetch failed" }
      );
    }
  }
);

/* ================= UPDATE ================= */
export const updateBoard = createAsyncThunk(
  "boards/updateBoard",
  async ({ id, boardData }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/boards/${id}`, boardData);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Update failed" }
      );
    }
  }
);

/* ================= DELETE ================= */
export const deleteBoard = createAsyncThunk(
  "boards/deleteBoard",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/boards/${id}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Delete failed" }
      );
    }
  }
);

/* ================= ASSIGN SCHOOL BOARDS ================= */
export const assignSchoolBoards = createAsyncThunk(
  "boards/assignSchoolBoards",
  async (assignData, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/boards/assignSchool-boards`, assignData);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Assign Boards failed" }
      );
    }
  }
);

/* ================= GET SCHOOL BOARDS ================= */
export const getSchoolBoards = createAsyncThunk(
  "boards/getSchoolBoards",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/boards/school-boards/${schoolId}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Failed to fetch school boards" }
      );
    }
  }
);

/* ================= REMOVE SCHOOL BOARD ================= */
export const removeSchoolBoard = createAsyncThunk(
  "boards/removeSchoolBoard",
  async (removeAssign, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/boards/removeAssignSchool-boards`, removeAssign);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: "Remove Assign Boards failed" }
      );
    }
  }
);

/* ================= INITIAL STATE ================= */
const initialState = {
  boards: [],
  totalBoards: 0,
  loading: false,
  error: null,          // ✅ always string or null
  assignSchool: [],
  schoolBoards: [],     // ✅ always array
};

/* ================= SLICE ================= */
const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* CREATE */
      .addCase(createBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const created = action.payload?.data;
        if (created && typeof created === "object" && created._id) {
          state.boards.unshift(created);
          state.totalBoards += 1;
        }
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = toMessage(action.payload, "Create failed");
      })

      /* GET ALL BOARDS */
      .addCase(getBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.boards = toArray(action.payload);
        state.totalBoards =
          action.payload?.data?.total ||
          action.payload?.total ||
          state.boards.length ||
          0;
      })
      .addCase(getBoards.rejected, (state, action) => {
        state.loading = false;
        state.boards = [];
        state.totalBoards = 0;
        state.error = toMessage(action.payload, "Fetch failed");
      })

      /* UPDATE */
      .addCase(updateBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const updated = action.payload?.data;
        if (!updated?._id) return;

        const index = state.boards.findIndex((b) => b._id === updated._id);
        if (index !== -1) {
          state.boards[index] = updated;
        }
      })
      .addCase(updateBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = toMessage(action.payload, "Update failed");
      })

      /* DELETE */
      .addCase(deleteBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const deletedId = action.payload?.data?._id;
        if (deletedId) {
          state.boards = state.boards.filter((b) => b._id !== deletedId);
          state.totalBoards = Math.max(0, state.totalBoards - 1);
        }
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = toMessage(action.payload, "Delete failed");
      })

      /* ASSIGN SCHOOL BOARDS */
      .addCase(assignSchoolBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignSchoolBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.assignSchool = toArray(action.payload);
      })
      .addCase(assignSchoolBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = toMessage(action.payload, "Assign Boards failed");
      })

      /* GET SCHOOL BOARDS */
      .addCase(getSchoolBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSchoolBoards.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ API: { success:false, message:"No boards found...", data:null }
        // then schoolBoards => []
        state.schoolBoards = toArray(action.payload);

        // optional: message string only, object nahi
        state.error = action.payload?.success === false
          ? toMessage(action.payload, null)
          : null;
      })
      .addCase(getSchoolBoards.rejected, (state, action) => {
        state.loading = false;
        state.schoolBoards = [];
        state.error = toMessage(action.payload, "Failed to fetch school boards");
      })

      /* REMOVE SCHOOL BOARD */
      .addCase(removeSchoolBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSchoolBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.assignSchool = toArray(action.payload);
      })
      .addCase(removeSchoolBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = toMessage(action.payload, "Remove Assign Boards failed");
      });
  },
});

export default boardSlice.reducer;
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

/* ================= CREATE BOARD ================= */
export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async (boardData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${Api_Base_Url}/boards`, boardData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Create failed");
    }
  }
);

/* ================= GET BOARDS ================= */
export const getBoards = createAsyncThunk(
  "boards/getBoards",
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${Api_Base_Url}/boards`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Fetch failed");
    }
  }
);

/* ================= UPDATE ================= */
export const updateBoard = createAsyncThunk(
  "boards/updateBoard",
  async ({ id, boardData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${Api_Base_Url}/boards/${id}`, boardData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Update failed");
    }
  }
);

/* ================= DELETE ================= */
export const deleteBoard = createAsyncThunk(
  "boards/deleteBoard",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.delete(`${Api_Base_Url}/boards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Delete failed");
    }
  }
);

/* ================= ASSIGN SCHOOL BOARDS ================= */
export const assignSchoolBoards = createAsyncThunk(
  "boards/assignSchoolBoards",
  async (assignData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${Api_Base_Url}/boards/assignSchool-boards`,
        assignData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || "Assign Boards failed");
    }
  }
);

/* ================= REMOVE SCHOOL BOARD ================= */
export const removeSchoolBoard = createAsyncThunk(
  "boards/removeSchoolBoard",
  async (removeAssign, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${Api_Base_Url}/boards/removeAssignSchool-boards`,
        removeAssign,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || "Remove Assign Boards failed"
      );
    }
  }
);

/* ================= SLICE ================= */
const initialState = {
  boards: [],
  totalBoards: 0,
  loading: false,
  error: null,
  assignSchool: [],
};

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
        if (action.payload?.data) {
          state.boards.push(action.payload.data);
          state.totalBoards += 1;
        }
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* GET ALL */
      .addCase(getBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = Array.isArray(action.payload?.data?.boards)
          ? action.payload.data.boards
          : [];
        state.totalBoards = action.payload?.data?.total || 0;
      })
      .addCase(getBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
      .addCase(updateBoard.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (!updated) return;
        const index = state.boards.findIndex((b) => b._id === updated._id);
        if (index !== -1) state.boards[index] = updated;
      })

      /* DELETE */
      .addCase(deleteBoard.fulfilled, (state, action) => {
        const deletedId = action.payload?.data?._id;
        if (deletedId) {
          state.boards = state.boards.filter((b) => b._id !== deletedId);
          state.totalBoards -= 1;
        }
      })

      /* ASSIGN SCHOOL BOARDS */
      .addCase(assignSchoolBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignSchoolBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.assignSchool = action.payload?.data || [];
      })
      .addCase(assignSchoolBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* REMOVE SCHOOL BOARD */
      .addCase(removeSchoolBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSchoolBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.assignSchool = action.payload?.data || [];
      })
      .addCase(removeSchoolBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default boardSlice.reducer;

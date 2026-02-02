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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      const res = await axios.put(
        `${Api_Base_Url}/boards/${id}`,
        boardData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

/* ================= SLICE ================= */
const initialState = {
  boards: [],
  totalBoards: 0,
  loading: false,
  error: null,
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
      })
      .addCase(getBoards.fulfilled, (state, action) => {
        state.loading = false;

        state.boards = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];

        state.totalBoards = action.payload?.total || 0;
      })
      .addCase(getBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
      .addCase(updateBoard.fulfilled, (state, action) => {
        const updated = action.payload?.data;

        if (!updated) return;

        const index = state.boards.findIndex(
          (b) => b._id === updated._id
        );

        if (index !== -1) state.boards[index] = updated;
      })

      /* DELETE */
      .addCase(deleteBoard.fulfilled, (state, action) => {
        const deletedId = action.payload?.data?._id;

        state.boards = state.boards.filter(
          (b) => b._id !== deletedId
        );
      });
  },
});

export default boardSlice.reducer;

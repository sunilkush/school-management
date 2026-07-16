import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const generateIdCard = createAsyncThunk(
  "idCards/generateIdCard",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/id-cards/generate", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const generateBulkIdCards = createAsyncThunk(
  "idCards/generateBulkIdCards",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/id-cards/generate-bulk", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getIdCards = createAsyncThunk(
  "idCards/getIdCards",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/id-cards?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deactivateIdCard = createAsyncThunk(
  "idCards/deactivateIdCard",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/id-cards/${id}/deactivate`, { reason });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  cards: [],
  pagination: null,
  loading: false,
  error: null,
};

const idCardSlice = createSlice({
  name: "idCards",
  initialState,
  reducers: {
    clearIdCardsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateIdCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateIdCard.fulfilled, (state, action) => {
        state.loading = false;
        state.cards.unshift(action.payload);
      })
      .addCase(generateIdCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(generateBulkIdCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBulkIdCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = [...(action.payload?.cards || []), ...state.cards];
      })
      .addCase(generateBulkIdCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getIdCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getIdCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload?.cards || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(getIdCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deactivateIdCard.fulfilled, (state, action) => {
        const updated = action.payload;
        state.cards = state.cards.map((c) => (c._id === updated._id ? updated : c));
      })
      .addCase(deactivateIdCard.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearIdCardsError } = idCardSlice.actions;
export default idCardSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const createIncident = createAsyncThunk(
  "discipline/createIncident",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/discipline-incidents", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getIncidents = createAsyncThunk(
  "discipline/getIncidents",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/discipline-incidents?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateIncident = createAsyncThunk(
  "discipline/updateIncident",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/discipline-incidents/${id}`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getStudentSummary = createAsyncThunk(
  "discipline/getStudentSummary",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/discipline-incidents/student/${studentId}/summary`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  incidents: [],
  pagination: null,
  summary: null,
  loading: false,
  error: null,
};

const disciplineSlice = createSlice({
  name: "discipline",
  initialState,
  reducers: {
    clearDisciplineSummary: (state) => {
      state.summary = null;
    },
    clearDisciplineError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createIncident.fulfilled, (state, action) => {
        state.incidents.unshift(action.payload);
      })
      .addCase(createIncident.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(getIncidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents = action.payload?.incidents || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(getIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateIncident.fulfilled, (state, action) => {
        const updated = action.payload;
        state.incidents = state.incidents.map((i) => (i._id === updated._id ? updated : i));
      })
      .addCase(updateIncident.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(getStudentSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(getStudentSummary.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearDisciplineSummary, clearDisciplineError } = disciplineSlice.actions;
export default disciplineSlice.reducer;

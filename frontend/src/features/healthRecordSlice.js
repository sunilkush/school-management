import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchHealthProfile = createAsyncThunk(
  "healthRecords/fetchHealthProfile",
  async (studentId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/health-records/profile/${studentId}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const upsertHealthProfile = createAsyncThunk(
  "healthRecords/upsertHealthProfile",
  async ({ studentId, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/health-records/profile/${studentId}`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createHealthVisit = createAsyncThunk(
  "healthRecords/createHealthVisit",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/health-records/visits", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchHealthVisits = createAsyncThunk(
  "healthRecords/fetchHealthVisits",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/health-records/visits?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateHealthVisit = createAsyncThunk(
  "healthRecords/updateHealthVisit",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/health-records/visits/${id}`, payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  profile: null,
  profileLoading: false,
  visits: [],
  pagination: null,
  loading: false,
  error: null,
};

const healthRecordSlice = createSlice({
  name: "healthRecords",
  initialState,
  reducers: {
    clearHealthProfile: (state) => {
      state.profile = null;
    },
    clearHealthRecordsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchHealthProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })

      .addCase(upsertHealthProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(upsertHealthProfile.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(createHealthVisit.fulfilled, (state, action) => {
        state.visits.unshift(action.payload);
      })
      .addCase(createHealthVisit.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchHealthVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealthVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.visits = action.payload?.visits || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchHealthVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateHealthVisit.fulfilled, (state, action) => {
        const updated = action.payload;
        state.visits = state.visits.map((v) => (v._id === updated._id ? updated : v));
      })
      .addCase(updateHealthVisit.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearHealthProfile, clearHealthRecordsError } = healthRecordSlice.actions;
export default healthRecordSlice.reducer;

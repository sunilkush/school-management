import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const generateCertificate = createAsyncThunk(
  "certificates/generateCertificate",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/certificates/generate", payload);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getCertificates = createAsyncThunk(
  "certificates/getCertificates",
  async (params = {}, { rejectWithValue }) => {
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      const query = new URLSearchParams(clean).toString();
      const res = await apiClient.get(`/certificates?${query}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getCertificateById = createAsyncThunk(
  "certificates/getCertificateById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/certificates/${id}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const revokeCertificate = createAsyncThunk(
  "certificates/revokeCertificate",
  async ({ id, revokeReason }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/certificates/${id}/revoke`, { revokeReason });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  certificates: [],
  pagination: null,
  currentCertificate: null,
  loading: false,
  error: null,
};

const certificateSlice = createSlice({
  name: "certificates",
  initialState,
  reducers: {
    clearCurrentCertificate: (state) => {
      state.currentCertificate = null;
    },
    clearCertificatesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateCertificate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateCertificate.fulfilled, (state, action) => {
        state.loading = false;
        state.certificates.unshift(action.payload);
      })
      .addCase(generateCertificate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getCertificates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCertificates.fulfilled, (state, action) => {
        state.loading = false;
        state.certificates = action.payload?.certificates || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(getCertificates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getCertificateById.fulfilled, (state, action) => {
        state.currentCertificate = action.payload;
      })

      .addCase(revokeCertificate.fulfilled, (state, action) => {
        const updated = action.payload;
        state.certificates = state.certificates.map((c) =>
          c._id === updated._id ? updated : c
        );
      })
      .addCase(revokeCertificate.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCertificate, clearCertificatesError } = certificateSlice.actions;
export default certificateSlice.reducer;

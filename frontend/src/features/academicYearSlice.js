import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("accessToken");

const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

/* ================= CREATE ================= */

export const createAcademicYear = createAsyncThunk(
  "academicYear/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${Api_Base_Url}/academicYear/create`,
        data,
        authHeader()
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= FETCH ALL ================= */

export const fetchAllAcademicYears = createAsyncThunk(
  "academicYear/fetchAll",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${Api_Base_Url}/academicYear/school/${schoolId}`,
        authHeader()
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= FETCH ACTIVE ================= */

export const fetchActiveAcademicYear = createAsyncThunk(
  "academicYear/fetchActive",
  async (schoolId, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${Api_Base_Url}/academicYear/active/${schoolId}`,
        authHeader()
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= SET ACTIVE ================= */

export const setActiveAcademicYear = createAsyncThunk(
  "academicYear/setActive",
  async (academicYearId, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${Api_Base_Url}/academicYear/activate/${academicYearId}`,
        {},
        authHeader()
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= ARCHIVE ================= */

export const archiveAcademicYear = createAsyncThunk(
  "academicYear/archive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${Api_Base_Url}/academicYear/archive/${id}`,
        {},
        authHeader()
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= DELETE ================= */

export const deleteAcademicYear = createAsyncThunk(
  "academicYear/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(
        `${Api_Base_Url}/academicYear/${id}`,
        authHeader()
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= UPDATE ================= */

export const updateAcademicYear = createAsyncThunk(
  "academicYear/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${Api_Base_Url}/academicYear/${id}`,
        data,
        authHeader()
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ================= SLICE ================= */

const academicYearSlice = createSlice({
  name: "academicYear",

  initialState: {
    academicYears: [],
    activeYear: null,
    selectedAcademicYear:
      JSON.parse(localStorage.getItem("selectedAcademicYear")) || null,
    loading: false,
    error: null,
    message: null,
  },

  reducers: {
    clearAcademicYearMessages: (state) => {
      state.error = null;
      state.message = null;
    },

    setSelectedAcademicYear: (state, action) => {
      state.selectedAcademicYear = action.payload;

      localStorage.setItem(
        "selectedAcademicYear",
        JSON.stringify(action.payload)
      );
    },
  },

  extraReducers: (builder) => {
    builder

      /* CREATE */

      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears.push(action.payload);
        state.message = "Academic year created successfully";
      })

      /* FETCH ALL */

      .addCase(fetchAllAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload;
      })

      /* FETCH ACTIVE */

      .addCase(fetchActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.activeYear = action.payload;

        if (!state.selectedAcademicYear) {
          state.selectedAcademicYear = action.payload;

          localStorage.setItem(
            "selectedAcademicYear",
            JSON.stringify(action.payload)
          );
        }
      })

      /* SET ACTIVE */

      .addCase(setActiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;

        state.activeYear = action.payload;
        state.selectedAcademicYear = action.payload;

        localStorage.setItem(
          "selectedAcademicYear",
          JSON.stringify(action.payload)
        );

        state.message = "Active academic year updated";

        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload._id
            ? { ...y, isActive: true, archived: false }
            : { ...y, isActive: false }
        );
      })

      /* ARCHIVE */

      .addCase(archiveAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;

        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload.data._id
            ? { ...y, isActive: false, archived: true }
            : y
        );

        if (state.activeYear?._id === action.payload.data._id) {
          state.activeYear = null;
        }
      })

      /* DELETE */

      .addCase(deleteAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;

        state.academicYears = state.academicYears.filter(
          (y) => y._id !== action.payload.data._id
        );
      })

      /* UPDATE */

      .addCase(updateAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Academic year updated";

        state.academicYears = state.academicYears.map((y) =>
          y._id === action.payload._id ? action.payload : y
        );
      })

      /* PENDING */

      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /* REJECTED */

      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearAcademicYearMessages, setSelectedAcademicYear } =
  academicYearSlice.actions;

export default academicYearSlice.reducer;
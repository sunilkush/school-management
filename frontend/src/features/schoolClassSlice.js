import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

// 🔐 Token helper


// ==============================
// 🔹 CREATE
// ==============================
export const createSchoolClass = createAsyncThunk(
  "schoolClass/create",
  async (data, { rejectWithValue }) => {
    try {
      console.log(data)
      const res = await apiClient.post(`/school-class`, data, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Create failed"
      );
    }
  }
);

//================================
// get Class detailes
//================================
export const getClassData = createAsyncThunk(
  "schoolClass/classes",
  async(params,{rejectWithValue})=>{
     try {
      const res = await apiClient.get(`/school-class/class-detailes`, {        params, // { schoolId, academicYearId }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch failed"
      );
    }
  }
)
// ==============================
// 🔹 GET ALL
// ==============================
export const fetchSchoolClasses = createAsyncThunk(
  "schoolClass/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/school-class`, {params, // { schoolId, academicYearId }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch failed"
      );
    }
  }
);


// ==============================
// 🔹 GET SINGLE
// ==============================
export const fetchSchoolClassById = createAsyncThunk(
  "schoolClass/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/school-class/${id}`, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch failed"
      );
    }
  }
);


// ==============================
// 🔹 UPDATE
// ==============================
export const updateSchoolClass = createAsyncThunk(
  "schoolClass/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/school-class/${id}`, data, {      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Update failed"
      );
    }
  }
);


// ==============================
// 🔹 DELETE
// ==============================
export const deleteSchoolClass = createAsyncThunk(
  "schoolClass/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/school-class/${id}`, {      });
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Delete failed"
      );
    }
  }
);


// ==============================
// 🔥 SLICE
// ==============================
const schoolClassSlice = createSlice({
  name: "schoolClass",
  initialState: {
    loading: false,
    error: null,
    schoolClasses: [],
    selected: null,
    success: false,
  },
  reducers: {
    resetSchoolClassState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder

      // 🔹 FETCH ALL
      .addCase(fetchSchoolClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSchoolClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolClasses = action.payload || [];
      })
      .addCase(fetchSchoolClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
        .addCase(getClassData.pending, (state) => {
        state.loading = true;
      })
      .addCase(getClassData.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolClasses = action.payload || [];
      })
      .addCase(getClassData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 🔹 CREATE
      .addCase(createSchoolClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSchoolClass.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolClasses.push(action.payload);
        state.success = true;
      })
      .addCase(createSchoolClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 GET ONE
      .addCase(fetchSchoolClassById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })

      // 🔹 UPDATE
      .addCase(updateSchoolClass.fulfilled, (state, action) => {
        const updated = action.payload;
        state.schoolClasses = state.schoolClasses.map((item) =>
          item._id === updated._id ? updated : item
        );
        state.success = true;
      })

      // 🔹 DELETE
      .addCase(deleteSchoolClass.fulfilled, (state, action) => {
        state.schoolClasses = state.schoolClasses.filter(
          (item) => item._id !== action.payload
        );
        state.success = true;
      });
  },
});

export const { resetSchoolClassState } = schoolClassSlice.actions;
export default schoolClassSlice.reducer;
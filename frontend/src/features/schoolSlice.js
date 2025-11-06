import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// ✅ Fetch all schools
export const fetchSchools = createAsyncThunk(
  "school/fetchSchools",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.get(`${Api_Base_Url}/school/getAllSchool`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.data.schools; // Ensure backend sends { data: { schools: [...] } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School list not found!"
      );
    }
  }
);

// ✅ Create new school
export const addSchool = createAsyncThunk(
  "school/create",
  async (schoolData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.post(`${Api_Base_Url}/school/register`, schoolData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Backend should return { data: { school, message } }
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School couldn't be registered"
      );
    }
  }
);

// ✅ Deactivate School
export const deactivateSchool = createAsyncThunk(
  "school/deactivate",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.put(
        `${Api_Base_Url}/school/deactivate/${schoolId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Backend returns { data: { school, message } }
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School couldn't be deactivated"
      );
    }
  }
);

// ✅ Delete School
export const deleteSchool = createAsyncThunk(
  "school/delete",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token found. Please login again.");
      }

      const res = await axios.delete(`${Api_Base_Url}/school/delete/${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Backend returns { data: { school, message } }
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "School couldn't be deleted"
      );
    }
  }
);

// ✅ Initial State
const initialState = {
  schools: [],
  school: null,
  loading: false,
  error: null,
  message: null,
  success: false,
  status: "idle",
};

// ✅ Slice
const schoolSlice = createSlice({
  name: "school",
  initialState,
  reducers: {
    resetSchoolState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch All
      .addCase(fetchSchools.pending, (state) => {
        state.loading = true;
        state.status = "loading";
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.loading = false;
        state.schools = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = "failed";
      })

      // ✅ Add School
      .addCase(addSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
        state.success = false;
      })
      .addCase(addSchool.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.school) {
          state.schools.push(action.payload.school);
        }
        state.message = action.payload?.message || "School added successfully.";
        state.success = true;
      })
      .addCase(addSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // ✅ Deactivate School
      .addCase(deactivateSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateSchool.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        state.schools = state.schools.map((s) =>
          s._id === updated._id ? updated : s
        );
        state.message = "School deactivated successfully.";
        state.success = true;
      })
      .addCase(deactivateSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Delete School
      .addCase(deleteSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
        state.success = false;
      })
      .addCase(deleteSchool.fulfilled, (state, action) => {
        state.loading = false;
        const deleted = action.payload;
        state.schools = state.schools.filter((s) => s._id !== deleted?._id);
        state.message = "School deleted successfully.";
        state.success = true;
      })
      .addCase(deleteSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetSchoolState } = schoolSlice.actions;
export default schoolSlice.reducer;

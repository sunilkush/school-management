import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// API base URL
const API = "http://localhost:9000/app/v1/role";

// Thunks

// 1. Fetch all roles
export const fetchRoles = createAsyncThunk(
  "role/fetchRoles",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const endpoint = schoolId
        ? `${API}/by-school?schoolId=${schoolId}`
        : `${API}/getAllRoles`;

      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Role list not accessible!"
      );
    }
  }
);

// 2. Fetch role by ID
export const fetchRoleById = createAsyncThunk(
  "role/fetchRoleById",
  async (roleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${API}/getRole/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  }
);

// 3. Create role
export const createRole = createAsyncThunk(
  "role/createRole",
  async (roleData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.post(`${API}/createRole`, roleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return res.data; // includes role + message
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Role creation failed!"
      );
    }
  }
);
// role search by school
export const fetchRoleBySchool = createAsyncThunk("role/fetchRoleBySchool",async(schoolId,{rejectWithValue})=>{
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await axios.get(`${API}/by-school?schoolId=${schoolId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data.data;
  } catch (error) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch roles by school"
    );
  }
})
// Initial state
const initialState = {
  roles: [],
  role: null,
  loading: false,
  error: null,
  success: false,
  message: "",
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    resetRoleState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder

      // fetchRoles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload || [];
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchRoleById
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.role = null;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.role = action.payload || null;
        localStorage.setItem("role", JSON.stringify(action.payload));
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createRole
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.message = "";
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.roles.push(action.payload.data);
        state.message = action.payload.message || "Role created successfully";
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Failed to create role";
      });

      // fetchRoleBySchool
      builder.addCase(fetchRoleBySchool.pending, (state) => {
        state.loading = true;
        state.error = null;
      }).addCase(fetchRoleBySchool.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload || [];
      }).addCase(fetchRoleBySchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch roles by school";
      });
  },
});

export const { resetRoleState } = roleSlice.actions;
export default roleSlice.reducer;

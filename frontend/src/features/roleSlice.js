import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";
import memoryStorage from "../utils/memoryStorage";


// 1️⃣ Fetch all roles (optionally by school)
export const fetchRoles = createAsyncThunk(
  "role/fetchRoles",
  async (schoolId, { rejectWithValue }) => {
    try {
     

      const endpoint = schoolId
        ? `/role/by-school?schoolId=${schoolId}`
        : `/role/getAllRoles`;

      const res = await apiClient.get(endpoint, {      });

      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Roles not accessible!");
    }
  }
);

// 2️⃣ Fetch role by ID
export const fetchRoleById = createAsyncThunk(
  "role/fetchRoleById",
  async (roleId, { rejectWithValue }) => {
    try {
     

      const res = await apiClient.get(`/role/getRole/${roleId}`, {      });

      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch role");
    }
  }
);

// 3️⃣ Create role
export const createRole = createAsyncThunk(
  "role/createRole",
  async (roleData, { rejectWithValue }) => {
    try {
     

      const res = await apiClient.post(`/role/createRole`, roleData, {      });

      return res.data; // includes { data, message }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Role creation failed!");
    }
  }
);

// Update role
export const updateRole = createAsyncThunk(
  "role/updateRole",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/role/updateRole/${id}`, data);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update role");
    }
  }
);

// Delete role
export const deleteRole = createAsyncThunk(
  "role/deleteRole",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/role/deleteRole/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete role");
    }
  }
);

// 4️⃣ Search roles by school
export const fetchRoleBySchool = createAsyncThunk(
  "role/fetchRoleBySchool",
  async (schoolId, { rejectWithValue }) => {
    try {
    

      const res = await apiClient.get(`/role/by-school`,
       
         {
          params: { schoolId },      });

      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch roles by school");
    }
  }
);
// Search roles by query
export const searchRoles = createAsyncThunk(
  "role/searchRoles",
  async (query, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/role/search`, { params: { name: query } });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Role search failed");
    }
  }
);
// Initial state
const initialState = {
  roles: [],
  role: null,
  loading: false,
  error: null,
  success: false,
  message: "",
   searchResults: [],
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
       state.searchResults = [];
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
        memoryStorage.setItem("role", JSON.stringify(action.payload));
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
        if (action.payload?.data) state.roles.push(action.payload.data);
        state.message = action.payload?.message || "Role created successfully";
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // updateRole
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.roles.findIndex((r) => r._id === action.payload?._id);
        if (idx !== -1) state.roles[idx] = action.payload;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // deleteRole
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchRoleBySchool
      .addCase(fetchRoleBySchool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleBySchool.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload || [];
      })
      .addCase(fetchRoleBySchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch roles by school";
      })

      // Search Roles
      .addCase(searchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload || [];
      })
      .addCase(searchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to search roles";
      });
  },
});

export const { resetRoleState } = roleSlice.actions;
export default roleSlice.reducer;

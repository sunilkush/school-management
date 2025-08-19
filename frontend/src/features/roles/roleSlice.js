import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL;

// 1️⃣ Fetch all roles (optionally by school)
export const fetchRoles = createAsyncThunk(
  "role/fetchRoles",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const endpoint = schoolId
        ? `${Api_Base_Url}/role/by-school?schoolId=${schoolId}`
        : `${Api_Base_Url}/role/getAllRoles`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${Api_Base_Url}/role/getRole/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
     
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.post(`${Api_Base_Url}/role/createRole`, roleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return res.data; // includes { data, message }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Role creation failed!");
    }
  }
);

// 4️⃣ Search roles by school
export const fetchRoleBySchool = createAsyncThunk(
  "role/fetchRoleBySchool",
  async (schoolId, { rejectWithValue }) => {
    try {
      
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${Api_Base_Url}/role/by-school`,
       
         {
          params: { schoolId },
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${Api_Base_Url}/role/search/${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        if (action.payload?.data) state.roles.push(action.payload.data);
        state.message = action.payload?.message || "Role created successfully";
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
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

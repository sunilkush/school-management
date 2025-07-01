import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// API base URL
const api = "http://localhost:9000/app/v1/role";

// Fetch all roles
export const fetchRoles = createAsyncThunk(
  "role/fetchRoles",
  async (schoolId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      if (schoolId) {
        const res = await axios.get(`${api}/by-school?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        return res.data.data;
      } else {
        const res = await axios.get(`${api}/getAllRoles`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        return res.data.data;
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Role list not accessible!"
      );
    }
  }
);

// Fetch role by ID
export const fetchRoleById = createAsyncThunk(
  "role/fetchRoleById",
  async (roleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const res = await axios.get(`${api}/getRole/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return res.data.data;
    } catch (error) {
      console.error("Fetch Role by ID Error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  }
);
// create role

export const createRole = createAsyncThunk(
  "role/createRole",
  async (roleData, { rejectWithValue }) => {
    

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      const response = await axios.post(`${api}/createRole`, roleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      console.log(response.data)
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Role register failed !"
      );
    }
  }
);
// Initial state
const initialState = {
  roles: [],
  role: null,
  loading: false,
  error: null,
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    resetRoleState: () => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all roles
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

      // Fetch role by ID
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
      });

    builder
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.roles.push(action.payload);
        state.message = action.payload.message;
      })
      .addCase(createRole.rejected, (state, action) => { });
  },
});

export default roleSlice.reducer;

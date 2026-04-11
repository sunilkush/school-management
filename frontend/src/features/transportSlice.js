import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

export const fetchVehicles = createAsyncThunk("transport/fetchVehicles", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/transport/vehicles");
    return response.data?.data || [];
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to fetch vehicles");
  }
});

export const createVehicle = createAsyncThunk("transport/createVehicle", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/transport/vehicles", payload);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to create vehicle");
  }
});

export const updateVehicle = createAsyncThunk(
  "transport/updateVehicle",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/transport/vehicles/${id}`, payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to update vehicle");
    }
  }
);

export const deleteVehicle = createAsyncThunk("transport/deleteVehicle", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/transport/vehicles/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to delete vehicle");
  }
});

export const fetchRoutes = createAsyncThunk("transport/fetchRoutes", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/transport/routes");
    return response.data?.data || [];
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to fetch routes");
  }
});

export const createRoute = createAsyncThunk("transport/createRoute", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/transport/routes", payload);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to create route");
  }
});

export const updateRoute = createAsyncThunk(
  "transport/updateRoute",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/transport/routes/${id}`, payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to update route");
    }
  }
);

export const deleteRoute = createAsyncThunk("transport/deleteRoute", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/transport/routes/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to delete route");
  }
});

export const fetchAssignableStudents = createAsyncThunk(
  "transport/fetchAssignableStudents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/transport/students");
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch students");
    }
  }
);

export const fetchAssignments = createAsyncThunk("transport/fetchAssignments", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/transport/assignments");
    return response.data?.data || [];
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to fetch assignments");
  }
});

export const saveAssignment = createAsyncThunk("transport/saveAssignment", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/transport/assignments", payload);
    return response.data?.data;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to save assignment");
  }
});

export const deleteAssignment = createAsyncThunk("transport/deleteAssignment", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/transport/assignments/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || "Failed to delete assignment");
  }
});

const initialState = {
  vehicles: [],
  routes: [],
  students: [],
  assignments: [],
  loading: false,
  error: null,
};

const transportSlice = createSlice({
  name: "transport",
  initialState,
  reducers: {
    clearTransportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        if (action.payload) state.vehicles.unshift(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        const idx = state.vehicles.findIndex((vehicle) => vehicle._id === updated._id);
        if (idx !== -1) state.vehicles[idx] = updated;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter((vehicle) => vehicle._id !== action.payload);
      })
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRoute.fulfilled, (state, action) => {
        if (action.payload) state.routes.unshift(action.payload);
      })
      .addCase(updateRoute.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        const idx = state.routes.findIndex((route) => route._id === updated._id);
        if (idx !== -1) state.routes[idx] = updated;
      })
      .addCase(deleteRoute.fulfilled, (state, action) => {
        state.routes = state.routes.filter((route) => route._id !== action.payload);
      })
      .addCase(fetchAssignableStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignableStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(fetchAssignableStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveAssignment.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;

        const idx = state.assignments.findIndex((assignment) => assignment._id === updated._id);
        if (idx !== -1) {
          state.assignments[idx] = updated;
          return;
        }

        const enrollmentId = updated.studentEnrollmentId?._id || updated.studentEnrollmentId;
        const existingByEnrollment = state.assignments.findIndex((assignment) => {
          const currentEnrollmentId = assignment.studentEnrollmentId?._id || assignment.studentEnrollmentId;
          return currentEnrollmentId === enrollmentId;
        });

        if (existingByEnrollment !== -1) {
          state.assignments[existingByEnrollment] = updated;
        } else {
          state.assignments.unshift(updated);
        }
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter((assignment) => assignment._id !== action.payload);
      });
  },
});

export const { clearTransportError } = transportSlice.actions;
export default transportSlice.reducer;

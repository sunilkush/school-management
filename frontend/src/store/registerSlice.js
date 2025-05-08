import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from "axios";

// Register Thunk with error handling
export const registerUser = createAsyncThunk(
  "user/register",
  async (userData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post("http://localhost:9000/app/v1/user/register", userData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;

    } catch (error) {
     
      if (error.response && error.response.data?.message) {

        return rejectWithValue(
          error.response?.data?.message
        );
      } else {
        return rejectWithValue(
          "Registration failed. Please try again."
        )
      }

    }
  }
);

const registerSlice = createSlice({
  name: "register",
  initialState: {
    user: null,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload; // Fixed: payload is already a string
      });
  },
});

export default registerSlice.reducer;

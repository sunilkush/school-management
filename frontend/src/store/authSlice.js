import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Async Thunk for Login

export const loginUser = createAsyncThunk(
   "auth/login",
   async (credentials, { rejectWithValue }) => {
      try {
         const response = await axios.post(
            "https://legendary-goldfish-54v4wvqgwxr364q-9000.app.github.dev/app/v1/user/login",
            credentials
         );

         console.log(response.data); // Debugging output

         return {
            user: response.data.data.user,
            accessToken: response.data.data.accessToken,
            refreshToken: response.data.data.refreshToken,
         };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || "Login Failed");
      }
   }
);

const authSlice = createSlice({
   name: "auth",
   initialState: {
      user: localStorage.getItem("user"),
      token: localStorage.getItem("token") || null,
      loading: false,
      error: null,
   },
   reducers: {
      login: (state, action) => {
         state.status = true;
         state.userData = action.payload.userData;
      },
      logout: (state) => {
         state.user = null;
         state.token = null;
         localStorage.removeItem("token");
         localStorage.removeItem("refreshToken");
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.accessToken;

            // Save token to local storage
            localStorage.setItem("token", action.payload.accessToken);
            localStorage.setItem("refreshToken", action.payload.refreshToken);
         })
         .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         });
   },
});

// Export actions & reducer
export const { login, logout } = authSlice.actions;
export default authSlice.reducer;

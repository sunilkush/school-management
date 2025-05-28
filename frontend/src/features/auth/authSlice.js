import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
//  LocalStorage init
const storedUser = localStorage.getItem('user');
const user = storedUser ? JSON.parse(storedUser) : null;

const accessToken = localStorage.getItem('accessToken');
//  Correct API path
const API = `https://legendary-goldfish-54v4wvqgwxr364q-9000.app.github.dev/app/v1/user`;

//  Login Thunk
export const login = createAsyncThunk("auth/user", async (credentials, thunkAPI) => {
  
  try {
    const res = await axios.post(`${API}/login`, credentials);
    console.log(res.data.data)
    return res.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || 'Login Failed',
      localStorage.clear()

    );
  }
});
//  Slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: user || null,
    accessToken: accessToken || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        localStorage.clear();
      })
      .addCase(login.fulfilled, (state, action) => {
        const { user, accessToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.loading = false;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        localStorage.clear();
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

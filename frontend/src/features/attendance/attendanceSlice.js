import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
const Api_Base_Url = import.meta.env.VITE_API_URL;
// Get token from localStorage
const token = localStorage.getItem("accessToken");
export const markAttendance = createAsyncThunk("attendance/mark", async (attendanceData, { rejectWithValue }) => {
   try {
   
      const response = await axios.post(`${Api_Base_Url}/attendance/mark`,attendanceData,{
            headers: { Authorization: `Bearer ${token}` },
      })
      return response.data;
   } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
   }
})

const attendanceSlice = createSlice({
    name: "attendance",
    initialState: {
        attendance: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearAttendance: (state) => {
            state.attendance = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(markAttendance.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(markAttendance.fulfilled, (state, action) => {
            state.loading = false;
            state.attendance.push(action.payload);
        })
        .addCase(markAttendance.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
}) 


export const {clearAttendance} = attendanceSlice.actions;
export default attendanceSlice.reducer;

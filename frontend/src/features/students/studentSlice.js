import { createAsyncThunk,createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
// Api Url
const Api_Base_Url  = import.meta.env.VITE_API_URL

export const fetchLastStudent = createAsyncThunk(
    "student/fetchLastStudent",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token found");

            const res = await axios.get(`${Api_Base_Url}/student/register/last`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            return res.data.data; // ✅ RETURN the result here
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch last registered student"
            );
        }
    }
);

const initialState = {
    lastStudent: null,
    loading: false,
    error: null,
}

const schoolSlice = createSlice(
    {
        name: "students",
        initialState,
        reducers: {},
        extraReducers: (builder) => {
            builder
                .addCase(fetchLastStudent.pending, (state) => {
                    state.loading = true;
                    state.error = null;
                })
                .addCase(fetchLastStudent.fulfilled, (state, action) => {
                    state.loading = false;
                    state.lastStudent = action.payload; // ✅ Store the result
                })
                .addCase(fetchLastStudent.rejected, (state, action) => {
                    state.loading = false;
                    state.error = action.payload || "Failed to fetch last student";
                    toast.error(state.error);
                });
        },
    }
)

export const { resetStudentState } = schoolSlice.actions;
export default schoolSlice.reducer;

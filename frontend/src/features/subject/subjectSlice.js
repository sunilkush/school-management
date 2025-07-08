import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
const api = "http://localhost:9000/app/v1/subject"
export const createSubject = createAsyncThunk("subject/createSubject", async (SubjectDate, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem("accessToken")
        const res = await axios.post(`${api}/create`, SubjectDate, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        console.log(res.data)
        return res.data
    } catch (error) {
        return rejectWithValue(
            error.response.message || "Subject Not Create !"
        )
    }
})

const initialState = {
    loading: false,
    error: null,
    subject: [],
    success: false,
}

const subjectSlice = createSlice({
    name: 'subject',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createSubject.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;

            })
            .addCase(createSubject.fulfilled, (state, action) => {
                state.loading = false;
                state.subject = action.payload;
                state.success = true;

            }).addCase(createSubject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
    }


})

export const { } = subjectSlice.actions;
export default subjectSlice.reducer
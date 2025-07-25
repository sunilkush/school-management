import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


const Api_Base_Url  = import.meta.env.API_BASE_URL
// Create a new subject
// This function will be called when the user submits the form to create a new subject
export const createSubject = createAsyncThunk("subject/createSubject", async (SubjectDate, { rejectWithValue }) => {
 
    try {
      
        const token = localStorage.getItem("accessToken")
        const res = await axios.post(`${Api_Base_Url}/subject/create`, SubjectDate, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        
        return res.data
    } catch (error) {
        return rejectWithValue(
             error?.response?.data?.message || "Subject creation failed!"
        )
    }
})

export const fetchAllSubjects = createAsyncThunk("subject/fetchAllSubjects", async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem("accessToken")
        const res = await axios.get(`${Api_Base_Url}/subject/all`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        
        return res.data
    } catch (error) {
        return rejectWithValue(
            error?.response?.data?.message || "Failed to fetch subjects!"
        )
    }
})
const initialState = {
  loading: false,
  error: null,
   subjectList: [],
  success: false,
};

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
        state.subjectList.push(action.payload);
        state.success = true;
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    builder
      .addCase(fetchAllSubjects.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(fetchAllSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjectList = action.payload.data; // Ensure array is in `data`
        state.success = true;
      })
      .addCase(fetchAllSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});


// eslint-disable-next-line no-empty-pattern
export const { } = subjectSlice.actions;
export default subjectSlice.reducer
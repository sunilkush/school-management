import { createAsyncThunk ,createSlice} from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:9000/app/v1/academicYear"; // Adjust the URL as needed
export const createAcadmicYear = createAsyncThunk("acadmicYear/create",
    
    async ( formData, { rejectWithValue }) => {
        
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.post(`${API_URL}/create`,formData , {
                headers: {
                    Authorization: `Bearer ${token}`,
                    
                }
            })
            return response.data
        }
        catch (error) {
            return rejectWithValue(error?.response?.data?.message || "Failed to create academic year")

        }
    });


    const acadmicYearSlice = createSlice({
        name:"acadmicYear",
        initialState: {
            acadmicYears: [],
            loading: false,
            error: null,
            message: null
        },
        reducers: {},
        extraReducers:(builder)=>{
               builder.addCase(createAcadmicYear.pending,(state)=>{
                   state.loading = true;
                   state.error = null;
                   state.message = null;
               }).addCase(createAcadmicYear.fulfilled,(state,action)=>{
                      state.loading = false;
                      state.acadmicYears.push(action.payload);
                      state.message = "Academic Year created successfully";
               }).addCase(createAcadmicYear.rejected,(state,action)=>{
                     state.loading = false;
                     state.error = action.payload || "failed to create academic year";
                     state.message = null;
               })
        } 
    })

   // eslint-disable-next-line no-empty-pattern
   export const { } = acadmicYearSlice.actions;

    export default  acadmicYearSlice.reducer;


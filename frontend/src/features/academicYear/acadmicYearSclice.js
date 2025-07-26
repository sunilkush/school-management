import { createAsyncThunk ,createSlice} from "@reduxjs/toolkit";
import axios from "axios";
const Api_Base_Url = import.meta.env.VITE_API_URL

console.log(Api_Base_Url)

export const createAcadmicYear = createAsyncThunk("acadmicYear/create",
    
    async ( formData, { rejectWithValue }) => {
        
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.post(`${Api_Base_Url}/academicYear/create`,formData , {
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

    export const fetchAllAcadmicYears = createAsyncThunk("acadmicYear/fetchAllAcadmicYears", async(_,{rejectWithValue})=>{
        try {
         
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`${Api_Base_Url}/academicYear/allYear`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            return response.data.data
        }
        catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Failed to fetch academic years!")
        }
    })

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
               });
               builder.addCase(fetchAllAcadmicYears.pending,(state)=>{
                     state.loading = true;
                     state.error = null;
                     state.message = null;
               }).addCase(fetchAllAcadmicYears.fulfilled,(state,action)=>{
                        state.loading = false;
                        state.acadmicYears = action.payload;
                        state.message = "Academic Years fetched successfully";
               }).addCase(fetchAllAcadmicYears.rejected,(state,action)=>{
                     state.loading = false;
                     state.error = action.payload || "Failed to fetch academic years";
                     state.message = null;
               });
        } 
    })

   // eslint-disable-next-line no-empty-pattern
   export const { } = acadmicYearSlice.actions;

    export default  acadmicYearSlice.reducer;


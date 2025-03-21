import axios from "axios"
import {createAsyncThunk,createSlice} from "@reduxjs/toolkit"

export const loginUser = createAsyncThunk("auth/login",async(credentials,{rejectWithValue})=>{
   try {
      const response = await axios.post("http://localhost:9000/app/v1/user/login",credentials)
      return response.data
   } catch (error) {
     return rejectWithValue(error.response.data.message || "Login Failed");
   }
})

const authSlice = createSlice({
    name:"auth",
    initialState:{
        user:null,
        token:localStorage.getItem("token") || null,
        loading:false,
        error:null
    },
    reducers:{
        logout:(state)=>{
           state.user = null;
           state.token = null;
           localStorage.removeItem("token");
        },
    },
    extraReducers:(builder)=>{
       builder.addCase(loginUser.pending,(state)=>{
        state.loading= true;
        state.error = null;
       })
       .addCase(loginUser.fulfilled,(state, action)=>{
        state.loading=false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token",action.payload.token);

       })
       .addCase(loginUser.rejected,(state, action)=>{
          state.loading = false;
          state.error = action.payload
       })
    }
})

export const {logout} = authSlice.actions;
export default authSlice.reducer;
export const registerUser = createAsyncThunk("user/register", async (userData) => {
    const response = await axios.post("http://localhost:9000/app/v1/user/register", userData);
    return response.data;
  });
  
  const registerSlice = createSlice({
    name: "register",
    initialState: { user: null, status: "idle", error: null },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(registerUser.pending, (state) => { state.status = "loading"; })
        .addCase(registerUser.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.user = action.payload;
        })
        .addCase(registerUser.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.error.message;
        });
    },
  });
  
  export default registerSlice.reducer;
  
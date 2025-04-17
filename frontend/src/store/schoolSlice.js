export const fetchSchools = createAsyncThunk("schools/fetchSchools", async () => {
    const response = await axios.get("http://localhost:9000/app/v1/schools");
    return response.data;
  });
  
  const schoolsSlice = createSlice({
    name: "schools",
    initialState: { schools: [], status: "idle", error: null },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchSchools.pending, (state) => { state.status = "loading"; })
        .addCase(fetchSchools.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.schools = action.payload;
        })
        .addCase(fetchSchools.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.error.message;
        });
    },
  });
  
  export default schoolsSlice.reducer;
  
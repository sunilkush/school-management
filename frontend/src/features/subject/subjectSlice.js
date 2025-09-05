import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


const Api_Base_Url = import.meta.env.VITE_API_URL
// Create a new subject
// This function will be called when the user submits the form to create a new subject
export const createSubject = createAsyncThunk("subject/createSubject", async ( SubjectDate, { rejectWithValue }) => {
  try {
    debugger
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

export const fetchAllSubjects = createAsyncThunk(
  "subject/fetchAllSubjects",
  async ({ schoolId, teacherId, section, search } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(`${Api_Base_Url}/subject/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { schoolId, teacherId, section, search }, // ✅ pass query params
      });
      console.log(res.data)
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch subjects!"
      );
    }
  }
);
// delete subject
// This function will be called when the user clicks the delete button on a subject
export const deleteSubject = createAsyncThunk("subject/deleteSubject", async (subjectId, { rejectWithValue }) => {
  try {
    // Get the token from localStorage
    console.log("Deleting subject with ID:", subjectId);

    const token = localStorage.getItem("accessToken")
    const res = await axios.delete(`${Api_Base_Url}/subject/${subjectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return res.data
  } catch (error) {
    return rejectWithValue(
      error?.response?.data?.message || "delete subject failed!"
    )
  }
})

// subject update
export const updateSubject = createAsyncThunk("subject/updateSubject", async ({ subjectId, subjectData }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("accessToken")
    const res = await axios.put(`${Api_Base_Url}/subject/${subjectId}`, subjectData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return res.data.data
  } catch (error) {
    return rejectWithValue(
      error?.response?.data?.message || "Subject update failed!"
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
        state.subjectList.push(action.payload); // ✅ Adds new subject instantly
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
        state.subjectList = action.payload.data?.subjects || []; // Ensure array is in `data`
        state.success = true;
      })
      .addCase(fetchAllSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    builder
      .addCase(deleteSubject.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deleteSubject.fulfilled, (state, action) => {
        state.subjectList = state.subjectList.filter(
          (subject) => subject._id !== action.payload
        );
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    builder.addCase(updateSubject.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    })
      .addCase(updateSubject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.subjectList.findIndex(subject => subject._id === action.payload._id);
        if (index !== -1) {
          state.subjectList[index] = action.payload; // Update the subject in the list
        }
        state.success = true;
      }
      )
      .addCase(updateSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});


// eslint-disable-next-line no-empty-pattern
export const { } = subjectSlice.actions;
export default subjectSlice.reducer
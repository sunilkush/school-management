import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const Api_Base_Url = import.meta.env.VITE_API_URL
// Create a new class
export const createClass = createAsyncThunk(
    "class/createClass",
    async (classData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`${Api_Base_Url}/class/create`, classData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Class created successfully:", res.data);
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Class creation failed!"
            );
        }
    }
);
// update fetch classes
export const fetchAllClasses = createAsyncThunk(
    "class/fetchAllClasses",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${Api_Base_Url}/class/allClasses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Failed to fetch classes!"
            );
        }
    }
);

// delete classes
export const deleteClass = createAsyncThunk(
    "class/deleteClass",   // ✅ unique type name
    async (classId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.delete(`${Api_Base_Url}/class/${classId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Class deleted successfully:", res.data);
            return classId; // return id so we can filter out from state
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Class deletion failed!"
            );
        }
    }
);

// update class
export const updateClass = createAsyncThunk(
    "class/updateClass",
    async ({ id, classData }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(`${Api_Base_Url}/class/${id}`, classData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Class updated successfully:", res.data);
            // return the updated class object from API
            return res.data.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || "Class update failed!"
            );
        }
    }
);

const initialState = {
    loading: false,
    error: null,
    classList: [],
    success: false,
};

const classSlice = createSlice({
    name: "class",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllClasses.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(fetchAllClasses.fulfilled, (state, action) => {
                state.loading = false;
                state.classList = action.payload.data;
                state.success = true;
            })
            .addCase(fetchAllClasses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
        builder
            .addCase(createClass.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(createClass.fulfilled, (state, action) => {
                state.loading = false;
                state.classList.push(action.payload.data);
                state.success = true;
            })
            .addCase(createClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
        builder
            .addCase(deleteClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteClass.fulfilled, (state, action) => {
                state.loading = false;
                state.classList = state.classList.filter(
                    (cls) => cls._id !== action.payload
                );
                state.success = true;
            })
            .addCase(deleteClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(updateClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateClass.fulfilled, (state, action) => {
                state.loading = false;
                const updatedClass = action.payload;

                state.classList = state.classList.map((cls) =>
                    cls._id === updatedClass._id ? updatedClass : cls
                );

                state.success = true;
            })
            .addCase(updateClass.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    }
})
// eslint-disable-next-line no-empty-pattern
export const { } = classSlice.actions;
export default classSlice.reducer;
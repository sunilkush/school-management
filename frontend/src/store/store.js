import { configureStore } from "@reduxjs/toolkit";
import roleReducer from "../features/roles/roleSlice";
import schoolReducer from "../features/schools/schoolSlice";
import authReducer from "../features/auth/authSlice";
import studentReducer from "../features/students/studentSlice";
const store = configureStore({
  reducer: {
    role: roleReducer,
    school: schoolReducer,
    auth: authReducer,
    students: studentReducer,
  },
  // Optional: Add middleware for debugging or logging
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // helps with non-serializable values like Dates
    }),
  devTools: process.env.NODE_ENV !== "production", // enable Redux DevTools in dev
});

export default store;

import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import roleReducer from '../features/roles/roleSlice'
export  const store = configureStore({
  reducer: {
    auth: authReducer,
    //school: schoolReducer,
    role: roleReducer,
  },
});

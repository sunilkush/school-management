import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import roleReducer from '../features/roles/roleSlice'
import schoolReducer from '../features/schools/schoolSlice'
export  const store = configureStore({
  reducer: {
    auth: authReducer,
    school: schoolReducer,
    role: roleReducer,
  },
});

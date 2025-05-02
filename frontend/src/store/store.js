import { configureStore } from "@reduxjs/toolkit";
import authReducer  from './authSlice';
import roleReducer from './roleSlice';
import schoolReducer from './schoolSlice';
import registerReducer from './registerSlice';
import schoolRegisterReducer  from "./schoolRegisterSlice";
const store = configureStore({
    reducer: {
        auth : authReducer ,
        roles: roleReducer,
        schools: schoolReducer,
        register: registerReducer,
        schoolRegister: schoolRegisterReducer,
    }
})

export default store
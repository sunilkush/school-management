import { configureStore } from "@reduxjs/toolkit";
import roleReducer from "../features/roles/roleSlice";
import schoolReducer from "../features/schools/schoolSlice";
import authReducer from "../features/auth/authSlice";
import studentReducer from "../features/students/studentSlice";
import subjectReducer from "../features/subject/subjectSlice"
import classReducer from "../features/classes/classSlice";
import academicYearReducer from "../features/academicYear/academicYearSlice";
import reportReducer from "../features/reports/reportSlice";
import dashboardReducer from "../features/Dashboard/dashboardSlice";
import examReducer from "../features/exams/examSlice";
import questionReducer from "../features/questions/questionSlice";
import attemptReducer from "../features/attempts/attemptSlice";
import sectionReducer from "../features/sections/sectionSlice";
import classSectionReducer from "../features/classes/classSectionSlice";
import employeeReducer from "../features/employee/employeeSlice";
const store = configureStore({
  reducer: {
    role: roleReducer,
    school: schoolReducer,
    auth: authReducer,
    students: studentReducer,
    subject: subjectReducer,
    class: classReducer,
    academicYear: academicYearReducer,
    reports: reportReducer,
    dashboard: dashboardReducer,
    exams: examReducer,
    questions: questionReducer,
    attempts: attemptReducer,
    section: sectionReducer,
    classSection:classSectionReducer,
    employee: employeeReducer,
  },
  // Optional: Add middleware for debugging or logging
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // helps with non-serializable values like Dates
    }),
  // eslint-disable-next-line no-undef
  devTools: process.env.NODE_ENV !== "production", // enable Redux DevTools in dev
});

export default store;

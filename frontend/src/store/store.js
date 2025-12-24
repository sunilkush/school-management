import { configureStore } from "@reduxjs/toolkit";
import roleReducer from "../features/roleSlice";
import schoolReducer from "../features/schoolSlice";
import authReducer from "../features/authSlice";
import studentReducer from "../features/studentSlice";
import subjectReducer from "../features/subjectSlice"
import classReducer from "../features/classSlice";
import academicYearReducer from "../features/academicYearSlice";
import reportReducer from "../features/reportSlice";
import dashboardReducer from "../features/dashboardSlice";
import examReducer from "../features/examSlice";
import questionReducer from "../features/questionSlice";
import attemptReducer from "../features/attemptSlice";
import sectionReducer from "../features/sectionSlice";
import classSectionReducer from "../features/classSectionSlice";
import employeeReducer from "../features/employeeSlice";
import subscriptionPlanReducer from "../features/subscriptionPlanSlice";
import feeReducer from "../features/feesSlice.js";
import feeHeadReducer from "../features/headSlice.js";
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
    subscriptionPlans: subscriptionPlanReducer,
    fees:feeReducer,
    feeHead:feeHeadReducer,
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

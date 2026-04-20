import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import roleReducer from "../features/roleSlice";
import schoolReducer from "../features/schoolSlice";
import authReducer from "../features/authSlice";
import studentReducer from "../features/studentSlice";
import subjectReducer from "../features/subjectSlice";
import classReducer from "../features/classSlice";
import academicYearReducer from "../features/academicYearSlice";
import reportReducer from "../features/reportSlice";
import examReportReducer from "../features/examReportSlice.js";
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
import feeStructureReducer from "../features/feeStructureSlice.js";
import studentFeeReducer from "../features/studentFeeSlice.js";
import paymentReducer from "../features/paymentSlice.js";
import feeInstallmentReducer from "../features/feeInstallmentSlice.js";
import activityReducer from "../features/activitySlice.js";
import boardsReducer from "../features/boardSlice.js";
import chapterReducer from "../features/chapterSlice.js";
import boardClassReducer from "../features/boardClassSlice.js";
import roleUiReducer from "../features/roleUiSlice.js";
import schoolClassReducer from "../features/schoolClassSlice.js";
import attendanceReducer from "../features/attendanceSlice.js";
import libraryReducer from "../features/librarySlice.js";
import transportReducer from "../features/transportSlice.js";
import inventoryReducer from "../features/inventorySlice.js";
import hostelReducer from "../features/hostelSlice.js";
import studentPortalReducer from "../features/studentPortalSlice.js";
import { attachAuthStore } from "../api/httpClient";
import { baseApi } from "../services/baseApi";
import accountRecoveryReducer from "../features/accountRecoverySlice";
import payrollReducer from "../features/payrollSlice";
import studentPromotionReducer from "../features/studentPromotionSlice";
import examModuleExamReducer from "../features/exam/examSliceV2";
import examSubjectConfigReducer from "../features/exam/examSubjectConfigSlice";
import examScheduleReducerV2 from "../features/exam/examScheduleSlice";
import questionBankReducerV2 from "../features/exam/questionBankSlice";
import questionPaperReducerV2 from "../features/exam/questionPaperSlice";
import examMarkReducerV2 from "../features/exam/examMarkSlice";
import examResultReducerV2 from "../features/exam/examResultSlice";
import examAnalyticsReducer from "../features/exam/examAnalyticsSlice";
import gradeScaleReducer from "../features/exam/gradeScaleSlice";
import onlineExamReducer from "../features/exam/onlineExamSlice";
import examAttemptReducerV2 from "../features/exam/examAttemptSlice";
import subjectiveEvaluationReducer from "../features/exam/subjectiveEvaluationSlice";

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "accessToken", "profile"],
};

const rootReducer = combineReducers({
  role: roleReducer,
  school: schoolReducer,
  auth: persistReducer(authPersistConfig, authReducer),
  students: studentReducer,
  subject: subjectReducer,
  class: classReducer,
  academicYear: academicYearReducer,
  reports: reportReducer,
  examReports: examReportReducer,
  dashboard: dashboardReducer,
  exams: examReducer,
  questions: questionReducer,
  attempts: attemptReducer,
  section: sectionReducer,
  classSection: classSectionReducer,
  employee: employeeReducer,
  subscriptionPlans: subscriptionPlanReducer,
  fees: feeReducer,
  feeHead: feeHeadReducer,
  feeStructure: feeStructureReducer,
  studentFee: studentFeeReducer,
  payment: paymentReducer,
  feeInstallment: feeInstallmentReducer,
  activity: activityReducer,
  chapter: chapterReducer,
  boards: boardsReducer,
  boardClass: boardClassReducer,
  roleUi: roleUiReducer,
  schoolClass: schoolClassReducer,
  attendance: attendanceReducer,
  library: libraryReducer,
  transport: transportReducer,
  inventory: inventoryReducer,
  hostel: hostelReducer,
  studentPortal: studentPortalReducer,
  accountRecovery: accountRecoveryReducer,
  payroll: payrollReducer,
  studentPromotion: studentPromotionReducer,
  examModuleExam: examModuleExamReducer,
  examSubjectConfig: examSubjectConfigReducer,
  examSchedule: examScheduleReducerV2,
  questionBank: questionBankReducerV2,
  questionPaper: questionPaperReducerV2,
  examMarksV2: examMarkReducerV2,
  examResultsV2: examResultReducerV2,
  examAnalytics: examAnalyticsReducer,
  gradeScale: gradeScaleReducer,
  onlineExam: onlineExamReducer,
  examAttemptV2: examAttemptReducerV2,
  subjectiveEvaluation: subjectiveEvaluationReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
  // eslint-disable-next-line no-undef
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

attachAuthStore(store);

export default store;

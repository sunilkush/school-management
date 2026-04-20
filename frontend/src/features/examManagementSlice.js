import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

const createThunk = (type, method, urlBuilder) =>
  createAsyncThunk(type, async (payload = {}, { rejectWithValue }) => {
    try {
      const { params, body } = payload || {};
      const url = typeof urlBuilder === "function" ? urlBuilder(payload) : urlBuilder;
      const config = params ? { params } : undefined;
      const response = await apiClient[method](url, body ?? config, body ? config : undefined);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

export const fetchExamSettings = createThunk("examManagement/fetchExamSettings", "get", "/exam-management/settings");
export const saveExamSettings = createThunk("examManagement/saveExamSettings", "put", "/exam-management/settings");
export const fetchManagedExams = createThunk("examManagement/fetchManagedExams", "get", "/exam-management/exams");
export const createManagedExam = createThunk("examManagement/createManagedExam", "post", "/exam-management/exams");
export const updateManagedExam = createThunk("examManagement/updateManagedExam", "put", ({ examId }) => `/exam-management/exams/${examId}`);
export const changeExamStatus = createThunk("examManagement/changeExamStatus", "patch", ({ examId }) => `/exam-management/exams/${examId}/status`);

export const fetchQuestionBank = createThunk("examManagement/fetchQuestionBank", "get", "/exam-management/question-bank");
export const createQuestionBankItem = createThunk("examManagement/createQuestionBankItem", "post", "/exam-management/question-bank");
export const importQuestionBank = createThunk("examManagement/importQuestionBank", "post", "/exam-management/question-bank/import");

export const saveExamPaper = createThunk("examManagement/saveExamPaper", "post", "/exam-management/papers");
export const fetchExamPaper = createThunk("examManagement/fetchExamPaper", "get", ({ examId }) => `/exam-management/papers/${examId}`);

export const fetchStudentOnlineExams = createThunk("examManagement/fetchStudentOnlineExams", "get", "/exam-management/student/online-exams");
export const startOnlineAttempt = createThunk("examManagement/startOnlineAttempt", "post", "/exam-management/student/attempt/start");
export const fetchActiveAttempt = createThunk("examManagement/fetchActiveAttempt", "get", ({ examId }) => `/exam-management/student/attempt/${examId}/active`);
export const saveOnlineAnswer = createThunk("examManagement/saveOnlineAnswer", "post", "/exam-management/student/attempt/answer");
export const submitOnlineAttempt = createThunk("examManagement/submitOnlineAttempt", "post", "/exam-management/student/attempt/submit");

export const fetchPendingEvaluations = createThunk("examManagement/fetchPendingEvaluations", "get", "/exam-management/evaluation/pending");
export const evaluateAnswer = createThunk("examManagement/evaluateAnswer", "patch", ({ answerId }) => `/exam-management/evaluation/answer/${answerId}`);
export const finalizeEvaluation = createThunk("examManagement/finalizeEvaluation", "post", "/exam-management/evaluation/finalize");

export const processResults = createThunk("examManagement/processResults", "post", "/exam-management/results/process");
export const publishResults = createThunk("examManagement/publishResults", "post", "/exam-management/results/publish");
export const fetchExamResults = createThunk("examManagement/fetchExamResults", "get", ({ examId }) => `/exam-management/results/exam/${examId}`);
export const fetchMyResult = createThunk("examManagement/fetchMyResult", "get", "/exam-management/results/me");
export const fetchReportCard = createThunk("examManagement/fetchReportCard", "get", "/exam-management/report-card/me");
export const fetchExamAnalytics = createThunk("examManagement/fetchExamAnalytics", "get", "/exam-management/analytics");

const slice = createSlice({
  name: "examManagement",
  initialState: {
    loading: false,
    error: null,
    settings: null,
    exams: [],
    questions: [],
    paper: null,
    studentOnlineExams: { upcoming: [], live: [], completed: [], resultPublished: [] },
    activeAttempt: null,
    pendingEvaluations: [],
    results: [],
    myResult: null,
    reportCard: null,
    analytics: null,
  },
  reducers: {
    clearExamManagementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher((action) => action.type.startsWith("examManagement/") && action.type.endsWith("/pending"), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher((action) => action.type.startsWith("examManagement/") && action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addMatcher((action) => action.type.startsWith("examManagement/") && action.type.endsWith("/fulfilled"), (state) => {
        state.loading = false;
      })
      .addCase(fetchExamSettings.fulfilled, (state, action) => { state.settings = action.payload; })
      .addCase(saveExamSettings.fulfilled, (state, action) => { state.settings = action.payload; })
      .addCase(fetchManagedExams.fulfilled, (state, action) => { state.exams = action.payload.exams || []; })
      .addCase(createManagedExam.fulfilled, (state, action) => { state.exams.unshift(action.payload); })
      .addCase(updateManagedExam.fulfilled, (state, action) => {
        const idx = state.exams.findIndex((item) => item._id === action.payload._id);
        if (idx >= 0) state.exams[idx] = action.payload;
      })
      .addCase(changeExamStatus.fulfilled, (state, action) => {
        const idx = state.exams.findIndex((item) => item._id === action.payload._id);
        if (idx >= 0) state.exams[idx] = action.payload;
      })
      .addCase(fetchQuestionBank.fulfilled, (state, action) => { state.questions = action.payload.questions || []; })
      .addCase(createQuestionBankItem.fulfilled, (state, action) => { state.questions.unshift(action.payload); })
      .addCase(importQuestionBank.fulfilled, (state, action) => { state.questions = [...(action.payload || []), ...state.questions]; })
      .addCase(fetchExamPaper.fulfilled, (state, action) => { state.paper = action.payload; })
      .addCase(saveExamPaper.fulfilled, (state, action) => { state.paper = action.payload; })
      .addCase(fetchStudentOnlineExams.fulfilled, (state, action) => { state.studentOnlineExams = action.payload || state.studentOnlineExams; })
      .addCase(fetchActiveAttempt.fulfilled, (state, action) => { state.activeAttempt = action.payload; })
      .addCase(startOnlineAttempt.fulfilled, (state, action) => { state.activeAttempt = { attempt: action.payload, answers: [] }; })
      .addCase(saveOnlineAnswer.fulfilled, (state, action) => {
        const answer = action.payload;
        const list = state.activeAttempt?.answers || [];
        const idx = list.findIndex((item) => item._id === answer._id);
        if (idx >= 0) list[idx] = answer;
        else list.push(answer);
      })
      .addCase(fetchPendingEvaluations.fulfilled, (state, action) => { state.pendingEvaluations = action.payload || []; })
      .addCase(fetchExamResults.fulfilled, (state, action) => { state.results = action.payload || []; })
      .addCase(fetchMyResult.fulfilled, (state, action) => { state.myResult = action.payload; })
      .addCase(fetchReportCard.fulfilled, (state, action) => { state.reportCard = action.payload; })
      .addCase(fetchExamAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; });
  },
});

export const { clearExamManagementError } = slice.actions;
export default slice.reducer;

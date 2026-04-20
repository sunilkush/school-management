import mongoose, { Schema } from "mongoose";

const OBJECT_ID = Schema.Types.ObjectId;

const applicableClassSchema = new Schema(
  {
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true },
    sectionIds: [{ type: OBJECT_ID, ref: "Section" }],
  },
  { _id: false }
);

const examSchema = new Schema(
  {
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    name: { type: String, required: true, trim: true },
    examType: {
      type: String,
      enum: ["Unit Test", "Weekly Test", "Monthly Test", "Quarterly", "Half Yearly", "Annual", "Pre Board", "Custom"],
      default: "Custom",
    },
    description: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicableClasses: { type: [applicableClassSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "scheduled", "ongoing", "completed", "published", "archived"],
      default: "draft",
      index: true,
    },
    resultStatus: {
      type: String,
      enum: ["not_generated", "generated", "published"],
      default: "not_generated",
      index: true,
    },
    publishResult: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    onlineSettings: {
      enabled: { type: Boolean, default: false },
      questionPaperId: { type: OBJECT_ID, ref: "QuestionPaper", default: null },
      durationMinutes: { type: Number, min: 1, default: 60 },
      startWindow: { type: Date },
      endWindow: { type: Date },
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
      maxAttempts: { type: Number, min: 1, default: 1 },
      autoSubmitOnTimeout: { type: Boolean, default: true },
      showInstantResult: { type: Boolean, default: false },
      allowResume: { type: Boolean, default: true },
      negativeMarkingEnabled: { type: Boolean, default: false },
    },
    createdBy: { type: OBJECT_ID, ref: "User", required: true },
    updatedBy: { type: OBJECT_ID, ref: "User" },
  },
  { timestamps: true, collection: "exam_module_exams" }
);

examSchema.pre("validate", function (next) {
  if (this.endDate < this.startDate) return next(new Error("endDate must be greater than or equal to startDate"));
  if (this.onlineSettings?.enabled && this.onlineSettings?.startWindow && this.onlineSettings?.endWindow) {
    if (this.onlineSettings.endWindow <= this.onlineSettings.startWindow) {
      return next(new Error("onlineSettings.endWindow must be after startWindow"));
    }
  }
  next();
});

examSchema.index({ schoolId: 1, academicYearId: 1, name: 1 }, { unique: true });
examSchema.index({ schoolId: 1, academicYearId: 1, status: 1, examType: 1 });

const examSubjectConfigSchema = new Schema(
  {
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", default: null, index: true },
    subjectId: { type: OBJECT_ID, ref: "Subject", required: true, index: true },
    maxMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
    theoryMarks: { type: Number, default: 0, min: 0 },
    practicalMarks: { type: Number, default: 0, min: 0 },
    internalMarks: { type: Number, default: 0, min: 0 },
    externalMarks: { type: Number, default: 0, min: 0 },
    gradeApplicable: { type: Boolean, default: true },
    evaluationMode: { type: String, enum: ["offline", "online", "hybrid"], default: "offline" },
    createdBy: { type: OBJECT_ID, ref: "User", required: true },
    updatedBy: { type: OBJECT_ID, ref: "User" },
  },
  { timestamps: true, collection: "exam_module_subject_configs" }
);

examSubjectConfigSchema.pre("validate", function (next) {
  const splitTotal = (this.theoryMarks || 0) + (this.practicalMarks || 0) + (this.internalMarks || 0) + (this.externalMarks || 0);
  if (this.passingMarks > this.maxMarks) return next(new Error("passingMarks cannot exceed maxMarks"));
  if (splitTotal > 0 && splitTotal !== this.maxMarks) return next(new Error("Split marks must equal maxMarks"));
  next();
});

examSubjectConfigSchema.index({ examId: 1, schoolClassId: 1, sectionId: 1, subjectId: 1 }, { unique: true });

const examScheduleSchema = new Schema(
  {
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", default: null, index: true },
    subjectId: { type: OBJECT_ID, ref: "Subject", required: true, index: true },
    examDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "" },
    invigilatorTeacherId: { type: OBJECT_ID, ref: "User", default: null },
    instructions: { type: String, default: "" },
    mode: { type: String, enum: ["offline", "online"], default: "offline" },
    meetingLink: { type: String, default: "" },
    status: { type: String, enum: ["draft", "scheduled", "completed", "cancelled"], default: "scheduled" },
  },
  { timestamps: true, collection: "exam_module_schedules" }
);

examScheduleSchema.index({ examId: 1, schoolClassId: 1, sectionId: 1, subjectId: 1 }, { unique: true });

const questionOptionSchema = new Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const questionBankSchema = new Schema(
  {
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", default: null, index: true },
    subjectId: { type: OBJECT_ID, ref: "Subject", required: true, index: true },
    chapterId: { type: OBJECT_ID, ref: "Chapter", default: null },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    marks: { type: Number, required: true, min: 1 },
    questionType: {
      type: String,
      enum: ["MCQ", "True/False", "Fill in the blanks", "Short Answer", "Long Answer", "Subjective", "Case Study"],
      required: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: { type: [questionOptionSchema], default: [] },
    correctAnswer: { type: Schema.Types.Mixed, default: null },
    explanation: { type: String, default: "" },
    tags: { type: [String], default: [] },
    answerFormat: { type: String, default: "text" },
    negativeMarks: { type: Number, default: 0, min: 0 },
    isOnlineAllowed: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active" },
    createdBy: { type: OBJECT_ID, ref: "User", required: true },
    updatedBy: { type: OBJECT_ID, ref: "User" },
  },
  { timestamps: true, collection: "exam_module_question_bank" }
);

questionBankSchema.index({ schoolId: 1, academicYearId: 1, schoolClassId: 1, subjectId: 1, difficulty: 1, questionType: 1 });
questionBankSchema.index({ questionText: "text", tags: "text" });

const paperSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    sectionMarks: { type: Number, required: true, min: 0 },
    questions: [{ type: OBJECT_ID, ref: "ExamModuleQuestionBank", required: true }],
  },
  { _id: false }
);

const questionPaperSchema = new Schema(
  {
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", default: null, index: true },
    subjectId: { type: OBJECT_ID, ref: "Subject", required: true, index: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    instructions: { type: String, default: "" },
    mode: { type: String, enum: ["offline", "online", "hybrid"], default: "offline" },
    sections: { type: [paperSectionSchema], default: [] },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ["draft", "final", "published"], default: "draft" },
    createdBy: { type: OBJECT_ID, ref: "User", required: true },
    updatedBy: { type: OBJECT_ID, ref: "User" },
  },
  { timestamps: true, collection: "exam_module_question_papers" }
);

questionPaperSchema.index({ examId: 1, schoolClassId: 1, sectionId: 1, subjectId: 1 }, { unique: true });

const studentExamMarkSchema = new Schema(
  {
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", required: true, index: true },
    subjectId: { type: OBJECT_ID, ref: "Subject", required: true, index: true },
    studentId: { type: OBJECT_ID, ref: "User", required: true, index: true },
    enrollmentId: { type: OBJECT_ID, ref: "StudentEnrollment", required: true },
    theoryObtained: { type: Number, default: 0, min: 0 },
    practicalObtained: { type: Number, default: 0, min: 0 },
    internalObtained: { type: Number, default: 0, min: 0 },
    externalObtained: { type: Number, default: 0, min: 0 },
    totalObtained: { type: Number, default: 0, min: 0 },
    isAbsent: { type: Boolean, default: false },
    isExempt: { type: Boolean, default: false },
    remarks: { type: String, default: "" },
    entryStatus: { type: String, enum: ["draft", "final"], default: "draft" },
    enteredBy: { type: OBJECT_ID, ref: "User", required: true },
    verifiedBy: { type: OBJECT_ID, ref: "User" },
    submittedAt: { type: Date },
  },
  { timestamps: true, collection: "exam_module_student_marks" }
);

studentExamMarkSchema.index({ examId: 1, sectionId: 1, subjectId: 1, studentId: 1 }, { unique: true });

const resultSubjectSchema = new Schema(
  {
    subjectId: { type: OBJECT_ID, ref: "Subject", required: true },
    maxMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    grade: { type: String, default: "" },
    isPassed: { type: Boolean, default: false },
    remarks: { type: String, default: "" },
    isAbsent: { type: Boolean, default: false },
  },
  { _id: false }
);

const examResultSchema = new Schema(
  {
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", required: true, index: true },
    studentId: { type: OBJECT_ID, ref: "User", required: true, index: true },
    enrollmentId: { type: OBJECT_ID, ref: "StudentEnrollment", required: true },
    subjects: { type: [resultSubjectSchema], default: [] },
    totalMaxMarks: { type: Number, required: true, min: 0 },
    totalObtainedMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    overallGrade: { type: String, default: "" },
    division: { type: String, default: "" },
    resultStatus: { type: String, enum: ["generated", "published"], default: "generated" },
    isPassed: { type: Boolean, default: false },
    classRank: { type: Number, default: null },
    sectionRank: { type: Number, default: null },
    generatedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date, default: null },
    generatedBy: { type: OBJECT_ID, ref: "User", required: true },
  },
  { timestamps: true, collection: "exam_module_results" }
);

examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const gradeScaleSchema = new Schema(
  {
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    name: { type: String, required: true },
    ranges: [
      {
        minPercent: { type: Number, required: true, min: 0, max: 100 },
        maxPercent: { type: Number, required: true, min: 0, max: 100 },
        grade: { type: String, required: true },
        remark: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true, collection: "exam_module_grade_scales" }
);

gradeScaleSchema.index({ schoolId: 1, academicYearId: 1, name: 1 }, { unique: true });

const examAttemptSchema = new Schema(
  {
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    questionPaperId: { type: OBJECT_ID, ref: "ExamModuleQuestionPaper", required: true, index: true },
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    schoolClassId: { type: OBJECT_ID, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: OBJECT_ID, ref: "Section", required: true, index: true },
    studentId: { type: OBJECT_ID, ref: "User", required: true, index: true },
    enrollmentId: { type: OBJECT_ID, ref: "StudentEnrollment", required: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["not_started", "in_progress", "submitted", "auto_submitted", "evaluated"], default: "in_progress" },
    startedAt: { type: Date, default: Date.now },
    lastSavedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalQuestions: { type: Number, default: 0 },
    attemptedCount: { type: Number, default: 0 },
    answeredCount: { type: Number, default: 0 },
    markedForReviewCount: { type: Number, default: 0 },
    objectiveScore: { type: Number, default: 0 },
    subjectiveScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    evaluationStatus: { type: String, enum: ["pending", "partial", "completed"], default: "pending" },
    browserMeta: { type: Schema.Types.Mixed, default: null },
    tabSwitchCount: { type: Number, default: 0 },
    isFullscreenViolated: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "exam_module_attempts" }
);

examAttemptSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
examAttemptSchema.index({ examId: 1, studentId: 1, status: 1 });

const examResponseSchema = new Schema(
  {
    examAttemptId: { type: OBJECT_ID, ref: "ExamModuleAttempt", required: true, index: true },
    examId: { type: OBJECT_ID, ref: "ExamModuleExam", required: true, index: true },
    questionPaperId: { type: OBJECT_ID, ref: "ExamModuleQuestionPaper", required: true, index: true },
    questionId: { type: OBJECT_ID, ref: "ExamModuleQuestionBank", required: true, index: true },
    studentId: { type: OBJECT_ID, ref: "User", required: true, index: true },
    selectedOption: { type: String, default: "" },
    answerText: { type: String, default: "" },
    uploadedAnswer: { type: String, default: "" },
    isCorrect: { type: Boolean, default: null },
    marksObtained: { type: Number, default: 0 },
    negativeMarksApplied: { type: Number, default: 0 },
    isMarkedForReview: { type: Boolean, default: false },
    isAnswered: { type: Boolean, default: false },
    answeredAt: { type: Date, default: null },
    savedAt: { type: Date, default: Date.now },
    evaluationStatus: { type: String, enum: ["pending", "auto_checked", "teacher_checked"], default: "pending" },
  },
  { timestamps: true, collection: "exam_module_responses" }
);

examResponseSchema.index({ examAttemptId: 1, questionId: 1 }, { unique: true });

const reportCardTemplateSchema = new Schema(
  {
    schoolId: { type: OBJECT_ID, ref: "School", required: true, index: true },
    academicYearId: { type: OBJECT_ID, ref: "AcademicYear", required: true, index: true },
    name: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: OBJECT_ID, ref: "User", required: true },
    updatedBy: { type: OBJECT_ID, ref: "User" },
  },
  { timestamps: true, collection: "exam_module_report_card_templates" }
);

export const ExamModuleExam = mongoose.models.ExamModuleExam || mongoose.model("ExamModuleExam", examSchema);
export const ExamModuleSubjectConfig = mongoose.models.ExamModuleSubjectConfig || mongoose.model("ExamModuleSubjectConfig", examSubjectConfigSchema);
export const ExamModuleSchedule = mongoose.models.ExamModuleSchedule || mongoose.model("ExamModuleSchedule", examScheduleSchema);
export const ExamModuleQuestionBank = mongoose.models.ExamModuleQuestionBank || mongoose.model("ExamModuleQuestionBank", questionBankSchema);
export const ExamModuleQuestionPaper = mongoose.models.ExamModuleQuestionPaper || mongoose.model("ExamModuleQuestionPaper", questionPaperSchema);
export const ExamModuleStudentMark = mongoose.models.ExamModuleStudentMark || mongoose.model("ExamModuleStudentMark", studentExamMarkSchema);
export const ExamModuleResult = mongoose.models.ExamModuleResult || mongoose.model("ExamModuleResult", examResultSchema);
export const ExamModuleGradeScale = mongoose.models.ExamModuleGradeScale || mongoose.model("ExamModuleGradeScale", gradeScaleSchema);
export const ExamModuleAttempt = mongoose.models.ExamModuleAttempt || mongoose.model("ExamModuleAttempt", examAttemptSchema);
export const ExamModuleResponse = mongoose.models.ExamModuleResponse || mongoose.model("ExamModuleResponse", examResponseSchema);
export const ExamModuleReportCardTemplate = mongoose.models.ExamModuleReportCardTemplate || mongoose.model("ExamModuleReportCardTemplate", reportCardTemplateSchema);

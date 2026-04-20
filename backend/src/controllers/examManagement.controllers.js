import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ExamSettings } from "../models/ExamSettings.model.js";
import { Exam } from "../models/Exam.model.js";
import { Section } from "../models/section.model.js";
import { Subject } from "../models/subject.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Question } from "../models/Questions.model.js";
import { ExamPaper } from "../models/ExamPaper.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { OnlineExamAttempt } from "../models/OnlineExamAttempt.model.js";
import { OnlineExamAnswer } from "../models/OnlineExamAnswer.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { Student } from "../models/student.model.js";

const ensureObjectId = (value, fieldName) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const getUserSchoolId = (user) => user?.schoolId?._id || user?.schoolId;
const getUserRole = (req) => req.userRole?.name || req.role?.name;
const privilegedRoles = ["Super Admin", "School Admin", "Exam Coordinator"];

const enforceSchoolScope = ({ user, targetSchoolId }) => {
  if (user?.roleId?.name === "Super Admin") return;
  if (`${getUserSchoolId(user)}` !== `${targetSchoolId}`) {
    throw new ApiError(403, "Forbidden for this school scope");
  }
};

const resolveAcademicYear = (req) => req.body.academicYearId || req.query.academicYearId;

const evaluateObjective = (question, response) => {
  const normalize = (value) => (Array.isArray(value) ? [...value].sort().join("|") : `${value ?? ""}`.trim().toLowerCase());
  const correct = question.correctAnswers?.length ? question.correctAnswers : [question.correctAnswer];
  return normalize(correct) === normalize(response);
};

const pickGrade = (ranges = [], percentage = 0) => {
  const grade = ranges.find((item) => percentage >= item.minPercentage && percentage <= item.maxPercentage);
  return grade?.label || "N/A";
};

const secureExamProjection = {
  questions: 0,
};

// A) Settings
export const upsertExamSettings = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const academicYearId = resolveAcademicYear(req);
  ensureObjectId(schoolId, "schoolId");
  ensureObjectId(academicYearId, "academicYearId");

  const payload = {
    ...req.body,
    schoolId,
    academicYearId,
    updatedBy: req.user._id,
  };

  const settings = await ExamSettings.findOneAndUpdate(
    { schoolId, academicYearId },
    { ...payload, createdBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(new ApiResponse(200, settings, "Exam settings saved successfully"));
});

export const getExamSettings = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const academicYearId = resolveAcademicYear(req);
  ensureObjectId(schoolId, "schoolId");
  ensureObjectId(academicYearId, "academicYearId");

  const settings = await ExamSettings.findOne({ schoolId, academicYearId }).lean();
  return res.status(200).json(new ApiResponse(200, settings, "Exam settings fetched"));
});

// B) Exam scheduling
export const createManagedExam = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const {
    academicYearId,
    schoolClassId,
    sectionId,
    subjectId,
    title,
    examType = "objective",
    examMode = "offline",
    status = "draft",
    schedule = {},
    instructions = "",
    room,
    invigilatorId,
    totalMarks,
    passingMarks,
  } = req.body;

  [academicYearId, schoolClassId, subjectId].forEach((id, index) =>
    ensureObjectId(id, ["academicYearId", "schoolClassId", "subjectId"][index])
  );
  if (sectionId) ensureObjectId(sectionId, "sectionId");

  const [schoolClass, subject, section] = await Promise.all([
    SchoolClass.findById(schoolClassId).select("schoolId academicYearId").lean(),
    Subject.findById(subjectId).select("schoolId").lean(),
    sectionId ? Section.findById(sectionId).select("schoolId schoolClassId").lean() : null,
  ]);

  if (!schoolClass || `${schoolClass.schoolId}` !== `${schoolId}` || `${schoolClass.academicYearId}` !== `${academicYearId}`) {
    throw new ApiError(400, "Invalid class ownership for this school/year");
  }
  if (!subject || (subject.schoolId && `${subject.schoolId}` !== `${schoolId}`)) {
    throw new ApiError(400, "Invalid subject ownership for this school");
  }
  if (section && (`${section.schoolId}` !== `${schoolId}` || `${section.schoolClassId}` !== `${schoolClassId}`)) {
    throw new ApiError(400, "Invalid section ownership for selected class");
  }

  const exam = await Exam.create({
    schoolId,
    academicYearId,
    schoolClassId,
    sectionId: sectionId || null,
    subjectId,
    title,
    examType,
    examCode: req.body.examCode,
    examDate: schedule.examDate || req.body.examDate,
    startTime: schedule.startTime || req.body.startTime,
    endTime: schedule.endTime || req.body.endTime,
    durationMinutes: schedule.durationMinutes || req.body.durationMinutes,
    totalMarks,
    passingMarks,
    status,
    createdBy: req.user._id,
    settings: {
      ...req.body.settings,
      mode: examMode,
      room: room || "",
      invigilatorId: invigilatorId || null,
      instructions,
      publishScheduleAt: schedule.publishScheduleAt || null,
    },
  });

  return res.status(201).json(new ApiResponse(201, exam, "Exam created successfully"));
});

export const listManagedExams = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const { page = 1, limit = 10, status, examMode, schoolClassId, subjectId } = req.query;
  const filters = { schoolId };
  if (status) filters.status = status;
  if (schoolClassId) filters.schoolClassId = schoolClassId;
  if (subjectId) filters.subjectId = subjectId;
  if (examMode) filters["settings.mode"] = examMode;

  const skip = (Number(page) - 1) * Number(limit);
  const [exams, total] = await Promise.all([
    Exam.find(filters, secureExamProjection)
      .populate("schoolClassId sectionId subjectId", "name")
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Exam.countDocuments(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      exams,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }, "Exam list fetched")
  );
});

export const updateManagedExam = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, "examId");
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError(404, "Exam not found");
  enforceSchoolScope({ user: req.user, targetSchoolId: exam.schoolId });

  Object.assign(exam, req.body);
  exam.updatedBy = req.user._id;
  await exam.save();

  return res.status(200).json(new ApiResponse(200, exam, "Exam updated successfully"));
});

export const transitionExamStatus = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, "examId");
  const { status } = req.body;
  if (!["draft", "published", "locked", "completed"].includes(status)) {
    throw new ApiError(400, "Invalid status transition");
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError(404, "Exam not found");
  enforceSchoolScope({ user: req.user, targetSchoolId: exam.schoolId });

  exam.status = status === "locked" ? "completed" : status;
  await exam.save();

  return res.status(200).json(new ApiResponse(200, exam, "Exam status updated"));
});

// C) Question bank
export const createQuestionBankItem = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const payload = {
    ...req.body,
    schoolId,
    topicId: req.body.topicId || null,
    createdBy: req.user._id,
  };

  const question = await Question.create(payload);
  return res.status(201).json(new ApiResponse(201, question, "Question added"));
});

export const importQuestionBank = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const rows = req.body.questions;
  if (!Array.isArray(rows) || !rows.length) throw new ApiError(400, "questions array is required");

  const payload = rows.map((item) => ({ ...item, schoolId, createdBy: req.user._id }));
  const created = await Question.insertMany(payload, { ordered: false });
  return res.status(201).json(new ApiResponse(201, created, "Questions imported"));
});

export const listQuestionBank = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const { page = 1, limit = 10, schoolClassId, subjectId, chapterId, topicId, questionType, difficulty, search } = req.query;
  const filters = { schoolId };
  if (schoolClassId) filters.schoolClassId = schoolClassId;
  if (subjectId) filters.subjectId = subjectId;
  if (chapterId) filters.chapterId = chapterId;
  if (topicId) filters.topicId = topicId;
  if (questionType) filters.questionType = questionType;
  if (difficulty) filters.difficulty = difficulty;
  if (search) filters.statement = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const [questions, total] = await Promise.all([
    Question.find(filters).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Question.countDocuments(filters),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    questions,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  }, "Question bank fetched"));
});

// D) Paper builder
export const upsertExamPaper = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const { examId, academicYearId, title, sections = [], passingMarks, negativeMarking = 0, shuffleQuestions = false, shuffleOptions = false } = req.body;
  [examId, academicYearId].forEach((id, idx) => ensureObjectId(id, ["examId", "academicYearId"][idx]));

  const computedSections = sections.map((section) => ({
    ...section,
    totalMarks: (section.questions || []).reduce((sum, q) => sum + Number(q.marks || 0), 0),
  }));

  const paper = await ExamPaper.findOneAndUpdate(
    { examId, schoolId, academicYearId },
    {
      examId,
      schoolId,
      academicYearId,
      title,
      sections: computedSections,
      passingMarks,
      negativeMarking,
      shuffleQuestions,
      shuffleOptions,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    },
    { new: true, upsert: true }
  );

  return res.status(200).json(new ApiResponse(200, paper, "Exam paper saved"));
});

export const cloneExamPaper = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, "paperId");
  const source = await ExamPaper.findById(req.params.id).lean();
  if (!source) throw new ApiError(404, "Paper not found");

  const cloned = await ExamPaper.create({
    ...source,
    _id: undefined,
    status: "draft",
    title: `${source.title} (Clone)`,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, cloned, "Paper cloned successfully"));
});

export const getExamPaper = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.examId, "examId");
  const paper = await ExamPaper.findOne({ examId: req.params.examId }).lean();
  return res.status(200).json(new ApiResponse(200, paper, "Paper fetched"));
});

// E) online attempts
export const listStudentOnlineExams = asyncHandler(async (req, res) => {
  const userRole = getUserRole(req);
  if (userRole !== "Student") throw new ApiError(403, "Only students can access this resource");

  const studentProfile = await Student.findOne({ userId: req.user._id }).select("_id").lean();
  if (!studentProfile) throw new ApiError(404, "Student profile not found");

  const enrollment = await StudentEnrollment.findOne({
    studentId: studentProfile._id,
    schoolId: getUserSchoolId(req.user),
    status: "Active",
  }).sort({ createdAt: -1 });

  if (!enrollment) return res.status(200).json(new ApiResponse(200, { upcoming: [], live: [], completed: [], resultPublished: [] }, "No exams assigned"));

  const now = new Date();
  const exams = await Exam.find({
    schoolId: enrollment.schoolId,
    academicYearId: enrollment.academicYearId,
    schoolClassId: enrollment.schoolClassId,
    $or: [{ sectionId: enrollment.sectionId }, { sectionId: null }],
    status: "published",
    "settings.mode": { $in: ["online", "hybrid"] },
  }, secureExamProjection).lean();

  const grouped = { upcoming: [], live: [], completed: [], resultPublished: [] };
  for (const exam of exams) {
    const end = new Date(exam.endTime);
    const start = new Date(exam.startTime);
    if (now < start) grouped.upcoming.push(exam);
    else if (now >= start && now <= end) grouped.live.push(exam);
    else grouped.completed.push(exam);
  }

  const publishedExamIds = await ExamResult.distinct("examIds", {
    schoolId: enrollment.schoolId,
    academicYearId: enrollment.academicYearId,
    studentId: req.user._id,
    publishStatus: "published",
  });
  grouped.resultPublished = exams.filter((exam) => publishedExamIds.some((id) => `${id}` === `${exam._id}`));

  return res.status(200).json(new ApiResponse(200, grouped, "Student online exams fetched"));
});

export const startOnlineAttempt = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  ensureObjectId(examId, "examId");
  const exam = await Exam.findById(examId).lean();
  if (!exam) throw new ApiError(404, "Exam not found");
  if (!["online", "hybrid"].includes(exam?.settings?.mode)) throw new ApiError(400, "This exam is not online enabled");

  const now = new Date();
  if (now < new Date(exam.startTime) || now > new Date(exam.endTime)) {
    throw new ApiError(400, "Exam is not accessible at this time");
  }

  const paper = await ExamPaper.findOne({ examId }).lean();
  if (!paper) throw new ApiError(400, "Exam paper is not configured");

  const maxAttempts = exam.settings?.maxAttempts || 1;
  const used = await OnlineExamAttempt.countDocuments({ examId, studentId: req.user._id });
  if (used >= maxAttempts) throw new ApiError(400, "Maximum attempts reached");

  const attempt = await OnlineExamAttempt.create({
    schoolId: exam.schoolId,
    academicYearId: exam.academicYearId,
    examId,
    examPaperId: paper._id,
    studentId: req.user._id,
    schoolClassId: exam.schoolClassId,
    sectionId: exam.sectionId,
    expiresAt: new Date(Date.now() + Number(exam.durationMinutes) * 60 * 1000),
    attemptNumber: used + 1,
  });

  const questionPayload = paper.sections.flatMap((section) => section.questions.map((question) => ({
    attemptId: attempt._id,
    examId,
    questionId: question.questionId,
    maxMarks: question.marks,
    questionType: "mixed",
  })));

  await OnlineExamAnswer.insertMany(questionPayload);

  return res.status(201).json(new ApiResponse(201, attempt, "Attempt started"));
});

export const saveOnlineAnswer = asyncHandler(async (req, res) => {
  const { attemptId, questionId, response, isMarkedForReview = false } = req.body;
  [attemptId, questionId].forEach((id, index) => ensureObjectId(id, ["attemptId", "questionId"][index]));

  const attempt = await OnlineExamAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (`${attempt.studentId}` !== `${req.user._id}`) throw new ApiError(403, "Forbidden attempt access");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt already submitted");

  const answer = await OnlineExamAnswer.findOneAndUpdate(
    { attemptId, questionId },
    { response, isMarkedForReview },
    { new: true }
  );

  if (!answer) throw new ApiError(404, "Question is not part of this attempt");

  return res.status(200).json(new ApiResponse(200, answer, "Answer saved"));
});

export const getActiveAttempt = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.examId, "examId");
  const attempt = await OnlineExamAttempt.findOne({
    examId: req.params.examId,
    studentId: req.user._id,
    status: "in_progress",
  }).lean();

  if (!attempt) return res.status(200).json(new ApiResponse(200, null, "No active attempt"));
  const answers = await OnlineExamAnswer.find({ attemptId: attempt._id }).lean();

  return res.status(200).json(new ApiResponse(200, { attempt, answers }, "Active attempt fetched"));
});

export const submitOnlineAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.body;
  ensureObjectId(attemptId, "attemptId");

  const attempt = await OnlineExamAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (`${attempt.studentId}` !== `${req.user._id}`) throw new ApiError(403, "Forbidden attempt access");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt already submitted");

  const answers = await OnlineExamAnswer.find({ attemptId }).populate("questionId", "questionType correctAnswers correctAnswer marks negativeMarks");

  let objectiveScore = 0;
  let subjectiveScore = 0;

  answers.forEach((answerDoc) => {
    const question = answerDoc.questionId;
    if (!question) return;

    const objectiveTypes = ["mcq_single", "mcq_multi", "true_false", "fill_blank"];
    if (objectiveTypes.includes(question.questionType)) {
      const isCorrect = evaluateObjective(question, answerDoc.response);
      answerDoc.autoEvaluated = true;
      answerDoc.isCorrect = isCorrect;
      answerDoc.obtainedMarks = isCorrect ? Number(answerDoc.maxMarks || question.marks || 0) : 0;
      objectiveScore += answerDoc.obtainedMarks;
    } else {
      subjectiveScore += Number(answerDoc.obtainedMarks || 0);
    }
  });

  await Promise.all(answers.map((item) => item.save()));

  attempt.submittedAt = new Date();
  attempt.status = new Date() > attempt.expiresAt ? "auto_submitted" : "submitted";
  attempt.objectiveScore = objectiveScore;
  attempt.subjectiveScore = subjectiveScore;
  attempt.totalScore = objectiveScore + subjectiveScore + Number(attempt.graceMarks || 0);
  await attempt.save();

  return res.status(200).json(new ApiResponse(200, attempt, "Attempt submitted"));
});

// F) teacher evaluation
export const getPendingEvaluations = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const attempts = await OnlineExamAttempt.find({
    schoolId,
    status: { $in: ["submitted", "auto_submitted"] },
    isFinalized: false,
  })
    .populate("examId", "title subjectId")
    .populate("studentId", "name email")
    .sort({ submittedAt: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, attempts, "Pending evaluations fetched"));
});

export const evaluateSubjectiveAnswer = asyncHandler(async (req, res) => {
  const { answerId } = req.params;
  ensureObjectId(answerId, "answerId");

  const { obtainedMarks, evaluatorRemarks } = req.body;
  const answer = await OnlineExamAnswer.findById(answerId);
  if (!answer) throw new ApiError(404, "Answer not found");

  answer.obtainedMarks = Number(obtainedMarks || 0);
  answer.evaluatorRemarks = evaluatorRemarks || "";
  answer.evaluatedBy = req.user._id;
  answer.evaluatedAt = new Date();
  answer.autoEvaluated = false;
  await answer.save();

  return res.status(200).json(new ApiResponse(200, answer, "Answer evaluated"));
});

export const finalizeEvaluation = asyncHandler(async (req, res) => {
  const { attemptId, graceMarks = 0, evaluatorRemarks = "" } = req.body;
  ensureObjectId(attemptId, "attemptId");

  const attempt = await OnlineExamAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");

  const answers = await OnlineExamAnswer.find({ attemptId });
  const score = answers.reduce((sum, item) => sum + Number(item.obtainedMarks || 0), 0);

  attempt.graceMarks = Number(graceMarks || 0);
  attempt.totalScore = score + attempt.graceMarks;
  attempt.status = "evaluated";
  attempt.isFinalized = true;
  attempt.evaluatedBy = req.user._id;
  attempt.evaluatorRemarks = evaluatorRemarks;
  await attempt.save();

  return res.status(200).json(new ApiResponse(200, attempt, "Evaluation finalized"));
});

// G/H) result + report card
export const processExamResults = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const { academicYearId, examId, schoolClassId, sectionId } = req.body;
  [academicYearId, examId, schoolClassId].forEach((id, idx) => ensureObjectId(id, ["academicYearId", "examId", "schoolClassId"][idx]));
  if (sectionId) ensureObjectId(sectionId, "sectionId");

  const settings = await ExamSettings.findOne({ schoolId, academicYearId }).lean();
  const attempts = await OnlineExamAttempt.find({
    schoolId,
    academicYearId,
    examId,
    schoolClassId,
    ...(sectionId ? { sectionId } : {}),
    status: "evaluated",
  }).lean();

  const exam = await Exam.findById(examId).select("subjectId totalMarks passingMarks").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  const resultDocs = attempts.map((attempt) => {
    const percentage = exam.totalMarks ? Number(((attempt.totalScore / exam.totalMarks) * 100).toFixed(2)) : 0;
    const grade = pickGrade(settings?.gradeRanges, percentage);
    const passStatus = percentage >= Number(settings?.passingRule?.minimumPercentage || 33) ? "pass" : "fail";

    return {
      schoolId,
      academicYearId,
      studentId: attempt.studentId,
      schoolClassId,
      sectionId: sectionId || null,
      examIds: [examId],
      subjects: [{
        subjectId: exam.subjectId,
        examId,
        totalMarks: exam.totalMarks,
        obtainedMarks: attempt.totalScore,
        percentage,
        grade,
        resultStatus: passStatus,
      }],
      totalMarks: exam.totalMarks,
      obtainedMarks: attempt.totalScore,
      percentage,
      overallGrade: grade,
      passStatus,
      publishStatus: "draft",
      processedBy: req.user._id,
    };
  });

  for (const result of resultDocs) {
    await ExamResult.findOneAndUpdate(
      { schoolId, academicYearId, studentId: result.studentId },
      result,
      { upsert: true, new: true }
    );
  }

  return res.status(200).json(new ApiResponse(200, { processed: resultDocs.length }, "Results processed"));
});

export const publishExamResults = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const { academicYearId, schoolClassId, sectionId, publishStatus = "published" } = req.body;
  [academicYearId, schoolClassId].forEach((id, idx) => ensureObjectId(id, ["academicYearId", "schoolClassId"][idx]));

  const filter = { schoolId, academicYearId, schoolClassId, ...(sectionId ? { sectionId } : {}) };
  const update = { publishStatus, publishedBy: req.user._id, publishedAt: new Date() };
  const result = await ExamResult.updateMany(filter, { $set: update });

  return res.status(200).json(new ApiResponse(200, result, "Result publish status updated"));
});

export const getResultsByExam = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.examId, "examId");
  const schoolId = getUserSchoolId(req.user);

  const results = await ExamResult.find({ schoolId, examIds: req.params.examId })
    .populate("studentId", "name regId")
    .sort({ obtainedMarks: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, results, "Exam results fetched"));
});

export const getMyResult = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const studentId = req.params.studentId || req.user._id;
  ensureObjectId(studentId, "studentId");

  if (getUserRole(req) === "Parent") {
    const child = await Student.findOne({
      userId: studentId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id");
    if (!child) throw new ApiError(403, "Forbidden child scope");
  }

  const result = await ExamResult.findOne({ schoolId, studentId })
    .populate("subjects.subjectId", "name")
    .lean();

  return res.status(200).json(new ApiResponse(200, result, "Result fetched"));
});

export const getReportCard = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const studentId = req.params.studentId || req.user._id;
  ensureObjectId(studentId, "studentId");

  const result = await ExamResult.findOne({ schoolId, studentId, publishStatus: "published" })
    .populate("studentId", "name regId")
    .populate("subjects.subjectId", "name code")
    .lean();

  if (!result) throw new ApiError(404, "Published result not found");

  const card = {
    student: result.studentId,
    summary: {
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      grade: result.overallGrade,
      passStatus: result.passStatus,
    },
    subjects: result.subjects,
    remarks: result.remarks,
    publishedAt: result.publishedAt,
  };

  return res.status(200).json(new ApiResponse(200, card, "Report card fetched"));
});

// I) analytics
export const getExamAnalyticsDashboard = asyncHandler(async (req, res) => {
  const schoolId = getUserSchoolId(req.user);
  const { academicYearId } = req.query;

  const baseFilters = { schoolId, ...(academicYearId ? { academicYearId } : {}) };

  const [examCount, attemptsCount, publishedResults, pendingEvaluations, topResults, weakResults] = await Promise.all([
    Exam.countDocuments(baseFilters),
    OnlineExamAttempt.countDocuments(baseFilters),
    ExamResult.countDocuments({ ...baseFilters, publishStatus: "published" }),
    OnlineExamAttempt.countDocuments({ ...baseFilters, status: { $in: ["submitted", "auto_submitted"] }, isFinalized: false }),
    ExamResult.find({ ...baseFilters, publishStatus: { $in: ["draft", "published"] } })
      .sort({ percentage: -1 })
      .limit(5)
      .populate("studentId", "name")
      .lean(),
    ExamResult.find({ ...baseFilters, publishStatus: { $in: ["draft", "published"] } })
      .sort({ percentage: 1 })
      .limit(5)
      .populate("studentId", "name")
      .lean(),
  ]);

  const passStats = await ExamResult.aggregate([
    { $match: { ...baseFilters, publishStatus: { $in: ["draft", "published"] } } },
    {
      $group: {
        _id: "$passStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalResults = passStats.reduce((sum, item) => sum + item.count, 0) || 1;
  const passCount = passStats.find((item) => item._id === "pass")?.count || 0;

  return res.status(200).json(new ApiResponse(200, {
    examCount,
    attemptsCount,
    publishedResults,
    pendingEvaluations,
    passPercentage: Number(((passCount / totalResults) * 100).toFixed(2)),
    topPerformers: topResults,
    weakPerformers: weakResults,
  }, "Exam analytics fetched"));
});

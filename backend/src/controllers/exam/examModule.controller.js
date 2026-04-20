import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { StudentEnrollment } from "../../models/StudentEnrollment.model.js";
import { Student } from "../../models/student.model.js";
import {
  ExamModuleAttempt,
  ExamModuleExam,
  ExamModuleGradeScale,
  ExamModuleQuestionBank,
  ExamModuleQuestionPaper,
  ExamModuleResponse,
  ExamModuleResult,
  ExamModuleSchedule,
  ExamModuleStudentMark,
  ExamModuleSubjectConfig,
} from "../../models/exam/exam.models.js";
import {
  calculateDivision,
  calculateGrade,
  computeRanks,
  evaluateExamAvailability,
  evaluateObjectiveResponse,
  getAttemptStatusByTimer,
  normalizeMarks,
} from "../../utils/exam/exam.helpers.js";

const isSuperAdmin = (req) => req.userRole?.name === "Super Admin";
const resolveSchoolId = (req, payloadSchoolId) => (isSuperAdmin(req) && payloadSchoolId ? payloadSchoolId : req.user.schoolId);
const buildSchoolFilter = (req, extra = {}) => ({ ...extra, schoolId: resolveSchoolId(req, extra.schoolId) });
const parsePage = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const resolveStudentDoc = async (user) => {
  const student = await Student.findOne({ userId: user._id }).select("_id userId fatherId motherId guardianId").lean();
  if (!student) throw new ApiError(404, "Student profile not found");
  return student;
};

const resolveResultStudentUserId = async (req, requestedStudentId) => {
  if (req.userRole?.name === "Student") return req.user._id;
  if (req.userRole?.name === "Parent") {
    const child = await Student.findOne({
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
      ...(requestedStudentId ? { userId: requestedStudentId } : {}),
    })
      .select("userId")
      .lean();
    if (!child) throw new ApiError(404, "No child mapped for this parent");
    return child.userId;
  }
  if (!requestedStudentId) throw new ApiError(400, "studentId is required");
  return requestedStudentId;
};

export const createExam = asyncHandler(async (req, res) => {
  const payload = { ...req.body, schoolId: resolveSchoolId(req, req.body.schoolId), createdBy: req.user._id, updatedBy: req.user._id };
  const exam = await ExamModuleExam.create(payload);
  res.status(201).json(new ApiResponse(201, exam, "Exam created"));
});

export const listExams = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = buildSchoolFilter(req, {});
  ["academicYearId", "examType", "status", "resultStatus"].forEach((key) => {
    if (req.query[key]) filter[key] = req.query[key];
  });
  if (req.query.schoolClassId) filter["applicableClasses.schoolClassId"] = req.query.schoolClassId;
  const [total, items] = await Promise.all([
    ExamModuleExam.countDocuments(filter),
    ExamModuleExam.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json(new ApiResponse(200, { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } }, "Exam list"));
});

export const getExam = asyncHandler(async (req, res) => {
  const exam = await ExamModuleExam.findOne(buildSchoolFilter(req, { _id: req.params.id })).lean();
  if (!exam) throw new ApiError(404, "Exam not found");
  res.json(new ApiResponse(200, exam, "Exam details"));
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await ExamModuleExam.findOneAndUpdate(
    buildSchoolFilter(req, { _id: req.params.id }),
    { $set: { ...req.body, updatedBy: req.user._id, schoolId: resolveSchoolId(req, req.body.schoolId) } },
    { new: true, runValidators: true }
  );
  if (!exam) throw new ApiError(404, "Exam not found");
  res.json(new ApiResponse(200, exam, "Exam updated"));
});

export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await ExamModuleExam.findOneAndDelete(buildSchoolFilter(req, { _id: req.params.id }));
  if (!exam) throw new ApiError(404, "Exam not found");
  res.json(new ApiResponse(200, exam, "Exam deleted"));
});

export const createSubjectConfig = asyncHandler(async (req, res) => {
  const payload = { ...req.body, schoolId: resolveSchoolId(req, req.body.schoolId), createdBy: req.user._id, updatedBy: req.user._id };
  const item = await ExamModuleSubjectConfig.create(payload);
  res.status(201).json(new ApiResponse(201, item, "Subject config created"));
});

export const listSubjectConfig = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  ["examId", "academicYearId", "schoolClassId", "sectionId", "subjectId"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  const items = await ExamModuleSubjectConfig.find(filter).sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, items, "Subject config list"));
});

export const updateSubjectConfig = asyncHandler(async (req, res) => {
  const item = await ExamModuleSubjectConfig.findOneAndUpdate(buildSchoolFilter(req, { _id: req.params.id }), { $set: { ...req.body, updatedBy: req.user._id } }, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "Config not found");
  res.json(new ApiResponse(200, item, "Subject config updated"));
});

export const deleteSubjectConfig = asyncHandler(async (req, res) => {
  const item = await ExamModuleSubjectConfig.findOneAndDelete(buildSchoolFilter(req, { _id: req.params.id }));
  if (!item) throw new ApiError(404, "Config not found");
  res.json(new ApiResponse(200, item, "Subject config deleted"));
});

export const createSchedule = asyncHandler(async (req, res) => {
  if (req.body.startTime >= req.body.endTime) throw new ApiError(400, "startTime must be before endTime");
  const overlap = await ExamModuleSchedule.findOne(buildSchoolFilter(req, {
    examDate: req.body.examDate,
    schoolClassId: req.body.schoolClassId,
    sectionId: req.body.sectionId || null,
    $or: [{ startTime: { $lt: req.body.endTime }, endTime: { $gt: req.body.startTime } }],
  })).lean();
  if (overlap) throw new ApiError(409, "Schedule overlap detected");
  const item = await ExamModuleSchedule.create({ ...req.body, sectionId: req.body.sectionId || null, schoolId: resolveSchoolId(req, req.body.schoolId) });
  res.status(201).json(new ApiResponse(201, item, "Schedule created"));
});

export const listSchedule = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  ["examId", "academicYearId", "schoolClassId", "sectionId", "subjectId", "mode"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  const items = await ExamModuleSchedule.find(filter).sort({ examDate: 1, startTime: 1 }).lean();
  res.json(new ApiResponse(200, items, "Schedules"));
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const item = await ExamModuleSchedule.findOneAndUpdate(buildSchoolFilter(req, { _id: req.params.id }), { $set: req.body }, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "Schedule not found");
  res.json(new ApiResponse(200, item, "Schedule updated"));
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const item = await ExamModuleSchedule.findOneAndDelete(buildSchoolFilter(req, { _id: req.params.id }));
  if (!item) throw new ApiError(404, "Schedule not found");
  res.json(new ApiResponse(200, item, "Schedule deleted"));
});

export const createQuestion = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionBank.create({ ...req.body, schoolId: resolveSchoolId(req, req.body.schoolId), createdBy: req.user._id, updatedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, item, "Question created"));
});

export const listQuestion = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  ["academicYearId", "schoolClassId", "sectionId", "subjectId", "difficulty", "questionType", "chapterId"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  if (req.query.tags) filter.tags = { $in: req.query.tags.split(",") };
  const { page, limit, skip } = parsePage(req.query);
  const [total, questions] = await Promise.all([
    ExamModuleQuestionBank.countDocuments(filter),
    ExamModuleQuestionBank.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json(new ApiResponse(200, { questions, pagination: { total, page, limit } }, "Questions"));
});

export const getQuestion = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionBank.findOne(buildSchoolFilter(req, { _id: req.params.id })).lean();
  if (!item) throw new ApiError(404, "Question not found");
  res.json(new ApiResponse(200, item, "Question"));
});
export const updateQuestion = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionBank.findOneAndUpdate(buildSchoolFilter(req, { _id: req.params.id }), { $set: { ...req.body, updatedBy: req.user._id } }, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "Question not found");
  res.json(new ApiResponse(200, item, "Question updated"));
});
export const deleteQuestion = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionBank.findOneAndDelete(buildSchoolFilter(req, { _id: req.params.id }));
  if (!item) throw new ApiError(404, "Question not found");
  res.json(new ApiResponse(200, item, "Question deleted"));
});

export const createPaper = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionPaper.create({ ...req.body, schoolId: resolveSchoolId(req, req.body.schoolId), createdBy: req.user._id, updatedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, item, "Question paper created"));
});
export const listPaper = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  ["examId", "academicYearId", "schoolClassId", "sectionId", "subjectId", "status", "mode"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  const items = await ExamModuleQuestionPaper.find(filter).sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, items, "Question papers"));
});
export const getPaper = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionPaper.findOne(buildSchoolFilter(req, { _id: req.params.id })).populate("sections.questions").lean();
  if (!item) throw new ApiError(404, "Question paper not found");
  res.json(new ApiResponse(200, item, "Question paper"));
});
export const updatePaper = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionPaper.findOneAndUpdate(buildSchoolFilter(req, { _id: req.params.id }), { $set: { ...req.body, updatedBy: req.user._id } }, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "Question paper not found");
  res.json(new ApiResponse(200, item, "Question paper updated"));
});
export const deletePaper = asyncHandler(async (req, res) => {
  const item = await ExamModuleQuestionPaper.findOneAndDelete(buildSchoolFilter(req, { _id: req.params.id }));
  if (!item) throw new ApiError(404, "Question paper not found");
  res.json(new ApiResponse(200, item, "Question paper deleted"));
});

export const bulkSaveMarks = asyncHandler(async (req, res) => {
  const { marks = [], examId, schoolClassId, sectionId, subjectId, academicYearId } = req.body;
  if (!Array.isArray(marks) || !marks.length) throw new ApiError(400, "marks array is required");
  const schoolId = resolveSchoolId(req, req.body.schoolId);
  const ops = marks.map((m) => {
    const totalObtained = m.isAbsent ? 0 : normalizeMarks({
      theory: m.theoryObtained,
      practical: m.practicalObtained,
      internal: m.internalObtained,
      external: m.externalObtained,
      maxMarks: m.maxMarks || Number.MAX_SAFE_INTEGER,
    });
    return {
      updateOne: {
        filter: { examId, schoolId, schoolClassId, sectionId, subjectId, studentId: m.studentId },
        update: {
          $set: {
            examId, schoolId, academicYearId, schoolClassId, sectionId, subjectId,
            studentId: m.studentId, enrollmentId: m.enrollmentId,
            theoryObtained: m.theoryObtained || 0, practicalObtained: m.practicalObtained || 0,
            internalObtained: m.internalObtained || 0, externalObtained: m.externalObtained || 0,
            totalObtained, isAbsent: !!m.isAbsent, isExempt: !!m.isExempt, remarks: m.remarks || "",
            entryStatus: "draft", enteredBy: req.user._id,
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    };
  });
  const result = await ExamModuleStudentMark.bulkWrite(ops, { ordered: false });
  res.json(new ApiResponse(200, result, "Marks saved"));
});

export const finalSubmitMarks = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {
    examId: req.body.examId,
    schoolClassId: req.body.schoolClassId,
    sectionId: req.body.sectionId,
    subjectId: req.body.subjectId,
  });
  const result = await ExamModuleStudentMark.updateMany({ ...filter, entryStatus: { $ne: "final" } }, { $set: { entryStatus: "final", submittedAt: new Date() } });
  res.json(new ApiResponse(200, result, "Marks finalized"));
});

export const listMarks = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  ["examId", "schoolClassId", "sectionId", "subjectId", "studentId"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  const items = await ExamModuleStudentMark.find(filter).lean();
  res.json(new ApiResponse(200, items, "Marks list"));
});

export const studentMarks = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, { studentId: req.params.studentId });
  if (req.userRole?.name === "Student") filter.studentId = req.user._id;
  const items = await ExamModuleStudentMark.find(filter).lean();
  res.json(new ApiResponse(200, items, "Student marks"));
});

export const generateResults = asyncHandler(async (req, res) => {
  const { examId, schoolClassId, sectionId } = req.body;
  const schoolId = resolveSchoolId(req, req.body.schoolId);
  const configs = await ExamModuleSubjectConfig.find({ examId, schoolClassId, sectionId: sectionId || null, schoolId }).lean();
  if (!configs.length) throw new ApiError(400, "No subject config found");

  const marks = await ExamModuleStudentMark.find({ examId, schoolClassId, sectionId, schoolId, entryStatus: "final" }).lean();
  if (!marks.length) throw new ApiError(400, "No final marks available");

  const marksByStudent = marks.reduce((acc, mark) => {
    const key = String(mark.studentId);
    acc[key] = acc[key] || [];
    acc[key].push(mark);
    return acc;
  }, {});

  const gradeScale = await ExamModuleGradeScale.findOne({ schoolId, academicYearId: req.body.academicYearId }).lean();

  const upserts = [];
  for (const [studentId, studentMarks] of Object.entries(marksByStudent)) {
    const subjects = studentMarks.map((mark) => {
      const cfg = configs.find((c) => String(c.subjectId) === String(mark.subjectId));
      return {
        subjectId: mark.subjectId,
        maxMarks: cfg?.maxMarks || 0,
        obtainedMarks: mark.totalObtained,
        passingMarks: cfg?.passingMarks || 0,
        grade: calculateGrade(((mark.totalObtained || 0) / (cfg?.maxMarks || 1)) * 100, gradeScale?.ranges || []),
        isPassed: mark.isAbsent ? false : (mark.totalObtained || 0) >= (cfg?.passingMarks || 0),
        remarks: mark.remarks || "",
        isAbsent: !!mark.isAbsent,
      };
    });
    const totalMaxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const totalObtainedMarks = subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
    const percentage = totalMaxMarks ? Number(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2)) : 0;
    const isPassed = subjects.every((s) => s.isPassed);

    upserts.push({
      updateOne: {
        filter: { examId, studentId, schoolId },
        update: {
          $set: {
            examId, schoolId, academicYearId: req.body.academicYearId, schoolClassId, sectionId,
            studentId, enrollmentId: studentMarks[0].enrollmentId,
            subjects, totalMaxMarks, totalObtainedMarks, percentage,
            overallGrade: calculateGrade(percentage, gradeScale?.ranges || []),
            division: calculateDivision(percentage),
            isPassed, generatedBy: req.user._id, generatedAt: new Date(), resultStatus: "generated",
          },
        },
        upsert: true,
      },
    });
  }

  await ExamModuleResult.bulkWrite(upserts, { ordered: false });
  const resultDocs = await ExamModuleResult.find({ examId, schoolId, schoolClassId, sectionId }).lean();

  const rankedClass = computeRanks(resultDocs);
  for (const row of rankedClass) {
    // eslint-disable-next-line no-await-in-loop
    await ExamModuleResult.updateOne({ _id: row._id }, { $set: { classRank: row.rank } });
  }

  const rankedSection = computeRanks(resultDocs);
  for (const row of rankedSection) {
    // eslint-disable-next-line no-await-in-loop
    await ExamModuleResult.updateOne({ _id: row._id }, { $set: { sectionRank: row.rank } });
  }

  await ExamModuleExam.updateOne({ _id: examId, schoolId }, { $set: { resultStatus: "generated" } });
  res.json(new ApiResponse(200, { generated: resultDocs.length }, "Results generated"));
});

export const listResults = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  ["examId", "schoolClassId", "sectionId", "studentId"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  if (["Student", "Parent"].includes(req.userRole?.name)) filter.resultStatus = "published";
  const items = await ExamModuleResult.find(filter).lean();
  res.json(new ApiResponse(200, items, "Results"));
});

export const resultByStudent = asyncHandler(async (req, res) => {
  const targetStudentId = await resolveResultStudentUserId(req, req.params.studentId);
  const filter = buildSchoolFilter(req, { studentId: targetStudentId });
  if (["Student", "Parent"].includes(req.userRole?.name)) filter.resultStatus = "published";
  const items = await ExamModuleResult.find(filter).sort({ generatedAt: -1 }).lean();
  res.json(new ApiResponse(200, items, "Student results"));
});

export const reportCardByStudent = asyncHandler(async (req, res) => {
  const studentId = await resolveResultStudentUserId(req, req.params.studentId);
  const result = await ExamModuleResult.findOne(
    buildSchoolFilter(req, {
      studentId,
      examId: req.query.examId,
      ...(req.query.schoolClassId ? { schoolClassId: req.query.schoolClassId } : {}),
      ...(req.query.sectionId ? { sectionId: req.query.sectionId } : {}),
    })
  )
    .populate("examId", "name examType startDate endDate")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjects.subjectId", "name code")
    .populate("studentId", "name email regId")
    .lean();

  if (!result) throw new ApiError(404, "Published report card not found");
  if (["Student", "Parent"].includes(req.userRole?.name) && result.resultStatus !== "published") {
    throw new ApiError(403, "Report card is not published");
  }

  const reportCard = {
    schoolInfo: { schoolId: result.schoolId, logo: null },
    student: {
      studentId: result.studentId?._id || result.studentId,
      name: result.studentId?.name || "Student",
      registrationNo: result.studentId?.regId || "",
      className: result.schoolClassId?.name || "",
      sectionName: result.sectionId?.name || "",
    },
    exam: result.examId,
    marks: result.subjects.map((subjectRow) => ({
      subjectId: subjectRow.subjectId?._id || subjectRow.subjectId,
      subjectName: subjectRow.subjectId?.name || "Subject",
      maxMarks: subjectRow.maxMarks,
      obtainedMarks: subjectRow.obtainedMarks,
      passingMarks: subjectRow.passingMarks,
      grade: subjectRow.grade,
      isPassed: subjectRow.isPassed,
      remarks: subjectRow.remarks,
      isAbsent: subjectRow.isAbsent,
    })),
    totals: {
      totalMaxMarks: result.totalMaxMarks,
      totalObtainedMarks: result.totalObtainedMarks,
      percentage: result.percentage,
      overallGrade: result.overallGrade,
      division: result.division,
      classRank: result.classRank,
      sectionRank: result.sectionRank,
    },
    generatedAt: result.generatedAt,
    publishedAt: result.publishedAt,
  };

  res.json(new ApiResponse(200, reportCard, "Report card fetched"));
});

export const publishResults = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, { examId: req.body.examId, schoolClassId: req.body.schoolClassId, sectionId: req.body.sectionId });
  const result = await ExamModuleResult.updateMany(filter, { $set: { resultStatus: "published", publishedAt: new Date() } });
  await ExamModuleExam.updateOne({ _id: req.body.examId }, { $set: { publishResult: true, resultStatus: "published" } });
  res.json(new ApiResponse(200, result, "Results published"));
});

export const unpublishResults = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, { examId: req.body.examId, schoolClassId: req.body.schoolClassId, sectionId: req.body.sectionId });
  const result = await ExamModuleResult.updateMany(filter, { $set: { resultStatus: "generated", publishedAt: null } });
  await ExamModuleExam.updateOne({ _id: req.body.examId }, { $set: { publishResult: false, resultStatus: "generated" } });
  res.json(new ApiResponse(200, result, "Results unpublished"));
});

export const analyticsOverview = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req, req.query.schoolId);
  const examMatch = { schoolId: new mongoose.Types.ObjectId(schoolId) };
  if (req.query.academicYearId) examMatch.academicYearId = new mongoose.Types.ObjectId(req.query.academicYearId);
  const [examStats, resultStats] = await Promise.all([
    ExamModuleExam.aggregate([{ $match: examMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ExamModuleResult.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), ...(req.query.academicYearId ? { academicYearId: new mongoose.Types.ObjectId(req.query.academicYearId) } : {}) } },
      { $group: { _id: null, passCount: { $sum: { $cond: ["$isPassed", 1, 0] } }, total: { $sum: 1 }, avgPercentage: { $avg: "$percentage" } } },
    ]),
  ]);
  res.json(new ApiResponse(200, { examStats, resultStats: resultStats[0] || {} }, "Analytics overview"));
});

export const classPerformance = asyncHandler(async (req, res) => {
  const schoolId = new mongoose.Types.ObjectId(resolveSchoolId(req, req.query.schoolId));
  const data = await ExamModuleResult.aggregate([
    { $match: { schoolId, ...(req.query.examId ? { examId: new mongoose.Types.ObjectId(req.query.examId) } : {}) } },
    { $group: { _id: "$schoolClassId", avgPercentage: { $avg: "$percentage" }, passCount: { $sum: { $cond: ["$isPassed", 1, 0] } }, total: { $sum: 1 } } },
  ]);
  res.json(new ApiResponse(200, data, "Class performance"));
});

export const subjectPerformance = asyncHandler(async (req, res) => {
  const schoolId = new mongoose.Types.ObjectId(resolveSchoolId(req, req.query.schoolId));
  const data = await ExamModuleResult.aggregate([
    { $match: { schoolId, ...(req.query.examId ? { examId: new mongoose.Types.ObjectId(req.query.examId) } : {}) } },
    { $unwind: "$subjects" },
    { $group: { _id: "$subjects.subjectId", avgObtained: { $avg: "$subjects.obtainedMarks" }, avgMax: { $avg: "$subjects.maxMarks" }, passCount: { $sum: { $cond: ["$subjects.isPassed", 1, 0] } }, total: { $sum: 1 } } },
  ]);
  res.json(new ApiResponse(200, data, "Subject performance"));
});

export const topperList = asyncHandler(async (req, res) => {
  const filter = buildSchoolFilter(req, {});
  if (req.query.examId) filter.examId = req.query.examId;
  const toppers = await ExamModuleResult.find(filter).sort({ percentage: -1 }).limit(Number(req.query.limit || 10)).lean();
  res.json(new ApiResponse(200, toppers, "Topper list"));
});

export const createGradeScale = asyncHandler(async (req, res) => {
  const item = await ExamModuleGradeScale.create({ ...req.body, schoolId: resolveSchoolId(req, req.body.schoolId) });
  res.status(201).json(new ApiResponse(201, item, "Grade scale created"));
});
export const listGradeScale = asyncHandler(async (req, res) => {
  const items = await ExamModuleGradeScale.find(buildSchoolFilter(req, req.query.academicYearId ? { academicYearId: req.query.academicYearId } : {})).lean();
  res.json(new ApiResponse(200, items, "Grade scales"));
});
export const updateGradeScale = asyncHandler(async (req, res) => {
  const item = await ExamModuleGradeScale.findOneAndUpdate(buildSchoolFilter(req, { _id: req.params.id }), { $set: req.body }, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "Grade scale not found");
  res.json(new ApiResponse(200, item, "Grade scale updated"));
});

const flattenPaperQuestions = (paper) => paper.sections.flatMap((section) => section.questions.map((questionId) => ({ sectionTitle: section.title, questionId })));

export const availableOnlineExams = asyncHandler(async (req, res) => {
  const student = await resolveStudentDoc(req.user);
  const currentEnrollment = await StudentEnrollment.findOne({
    schoolId: req.user.schoolId,
    studentId: student._id,
    status: "Active",
  })
    .sort({ createdAt: -1 })
    .lean();
  const filter = buildSchoolFilter(req, { "onlineSettings.enabled": true, status: { $in: ["scheduled", "ongoing", "published"] } });
  const exams = await ExamModuleExam.find(filter).lean();
  const filtered = currentEnrollment
    ? exams.filter((exam) => exam.applicableClasses.some((entry) => String(entry.schoolClassId) === String(currentEnrollment.schoolClassId) && (!entry.sectionIds.length || entry.sectionIds.some((sec) => String(sec) === String(currentEnrollment.sectionId)))))
    : exams;
  res.json(new ApiResponse(200, filtered, "Available online exams"));
});

export const startOnlineExam = asyncHandler(async (req, res) => {
  const exam = await ExamModuleExam.findOne(buildSchoolFilter(req, { _id: req.params.examId })).lean();
  if (!exam) throw new ApiError(404, "Exam not found");
  evaluateExamAvailability({ exam });

  const student = await resolveStudentDoc(req.user);
  const enrollment = await StudentEnrollment.findOne({
    schoolId: exam.schoolId,
    academicYearId: exam.academicYearId,
    studentId: student._id,
    status: "Active",
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!enrollment) throw new ApiError(400, "Student enrollment not found for exam");

  const paper = await ExamModuleQuestionPaper.findById(exam.onlineSettings.questionPaperId).lean();
  if (!paper) throw new ApiError(400, "Question paper not assigned");

  const activeAttempt = await ExamModuleAttempt.findOne({ examId: exam._id, studentId: req.user._id, status: "in_progress" }).lean();
  if (activeAttempt && exam.onlineSettings.allowResume) return res.json(new ApiResponse(200, activeAttempt, "Resumed active attempt"));

  const attemptsCount = await ExamModuleAttempt.countDocuments({ examId: exam._id, studentId: req.user._id });
  if (attemptsCount >= (exam.onlineSettings.maxAttempts || 1)) throw new ApiError(400, "Attempt limit exceeded");

  const attempt = await ExamModuleAttempt.create({
    examId: exam._id,
    questionPaperId: paper._id,
    schoolId: exam.schoolId,
    academicYearId: exam.academicYearId,
    schoolClassId: enrollment.schoolClassId,
    sectionId: enrollment.sectionId,
    studentId: req.user._id,
    enrollmentId: enrollment._id,
    attemptNumber: attemptsCount + 1,
    durationMinutes: exam.onlineSettings.durationMinutes || paper.durationMinutes,
    totalQuestions: flattenPaperQuestions(paper).length,
    browserMeta: req.body.browserMeta || null,
    status: "in_progress",
  });

  res.status(201).json(new ApiResponse(201, attempt, "Attempt started"));
});

export const getOnlineAttempt = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findById(req.params.attemptId).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.studentId) !== String(req.user._id) && !["Super Admin", "School Admin", "Teacher"].includes(req.userRole?.name)) {
    throw new ApiError(403, "Unauthorized attempt access");
  }
  const paper = await ExamModuleQuestionPaper.findById(attempt.questionPaperId).populate("sections.questions").lean();
  const responses = await ExamModuleResponse.find({ examAttemptId: attempt._id }).lean();
  const timer = getAttemptStatusByTimer({ attempt });
  if (timer.expired && attempt.status === "in_progress") {
    await ExamModuleAttempt.updateOne({ _id: attempt._id }, { $set: { status: "auto_submitted", submittedAt: new Date() } });
  }
  res.json(new ApiResponse(200, { attempt, paper, responses, timer }, "Attempt details"));
});

export const saveAnswer = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findById(req.params.attemptId).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.status !== "in_progress") throw new ApiError(400, "Attempt is not active");
  if (String(attempt.studentId) !== String(req.user._id)) throw new ApiError(403, "Cannot save answer for another student");
  const question = await ExamModuleQuestionBank.findById(req.body.questionId).lean();
  if (!question) throw new ApiError(404, "Question not found");

  const evalResult = evaluateObjectiveResponse({ question, response: req.body, negativeMarkingEnabled: true });

  await ExamModuleResponse.findOneAndUpdate(
    { examAttemptId: attempt._id, questionId: req.body.questionId },
    {
      $set: {
        examAttemptId: attempt._id,
        examId: attempt.examId,
        questionPaperId: attempt.questionPaperId,
        questionId: req.body.questionId,
        studentId: req.user._id,
        selectedOption: req.body.selectedOption || "",
        answerText: req.body.answerText || "",
        isMarkedForReview: !!req.body.isMarkedForReview,
        isAnswered: !!(req.body.selectedOption || req.body.answerText),
        answeredAt: new Date(),
        savedAt: new Date(),
        ...evalResult,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  const agg = await ExamModuleResponse.aggregate([
    { $match: { examAttemptId: attempt._id } },
    {
      $group: {
        _id: null,
        answeredCount: { $sum: { $cond: ["$isAnswered", 1, 0] } },
        markedForReviewCount: { $sum: { $cond: ["$isMarkedForReview", 1, 0] } },
        objectiveScore: { $sum: "$marksObtained" },
      },
    },
  ]);

  await ExamModuleAttempt.updateOne(
    { _id: attempt._id },
    {
      $set: {
        answeredCount: agg[0]?.answeredCount || 0,
        attemptedCount: agg[0]?.answeredCount || 0,
        markedForReviewCount: agg[0]?.markedForReviewCount || 0,
        objectiveScore: agg[0]?.objectiveScore || 0,
        totalScore: (agg[0]?.objectiveScore || 0) + Number(attempt.subjectiveScore || 0),
        lastSavedAt: new Date(),
      },
    }
  );

  res.json(new ApiResponse(200, { saved: true }, "Answer saved"));
});

export const markReview = asyncHandler(async (req, res) => {
  await ExamModuleResponse.updateOne({ examAttemptId: req.params.attemptId, questionId: req.body.questionId }, { $set: { isMarkedForReview: !!req.body.isMarkedForReview, savedAt: new Date() } });
  res.json(new ApiResponse(200, { updated: true }, "Review flag updated"));
});

export const clearAnswer = asyncHandler(async (req, res) => {
  await ExamModuleResponse.updateOne(
    { examAttemptId: req.params.attemptId, questionId: req.body.questionId },
    { $set: { selectedOption: "", answerText: "", isAnswered: false, marksObtained: 0, isCorrect: null, evaluationStatus: "pending", savedAt: new Date() } }
  );
  res.json(new ApiResponse(200, { cleared: true }, "Answer cleared"));
});

export const heartbeat = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findByIdAndUpdate(req.params.attemptId, { $inc: { tabSwitchCount: Number(req.body.tabSwitchIncrement || 0) }, $set: { lastSavedAt: new Date(), isFullscreenViolated: !!req.body.isFullscreenViolated } }, { new: true }).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  const timer = getAttemptStatusByTimer({ attempt });
  if (timer.expired && attempt.status === "in_progress") {
    await ExamModuleAttempt.updateOne({ _id: attempt._id }, { $set: { status: "auto_submitted", submittedAt: new Date() } });
  }
  res.json(new ApiResponse(200, { timer, attemptStatus: timer.expired ? "auto_submitted" : "in_progress" }, "Heartbeat saved"));
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findById(req.params.attemptId).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.studentId) !== String(req.user._id)) throw new ApiError(403, "Cannot submit another student's attempt");
  if (!["in_progress", "auto_submitted"].includes(attempt.status)) throw new ApiError(400, "Attempt already submitted");

  const responses = await ExamModuleResponse.find({ examAttemptId: attempt._id }).lean();
  const hasSubjectivePending = responses.some((response) => response.evaluationStatus === "pending");
  const totalScore = responses.reduce((sum, row) => sum + Number(row.marksObtained || 0), 0);

  await ExamModuleAttempt.updateOne(
    { _id: attempt._id },
    {
      $set: {
        status: "submitted",
        submittedAt: new Date(),
        totalScore,
        evaluationStatus: hasSubjectivePending ? "partial" : "completed",
      },
    }
  );

  res.json(new ApiResponse(200, { submitted: true, evaluationStatus: hasSubjectivePending ? "partial" : "completed" }, "Attempt submitted"));
});

export const onlineAttemptResult = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findById(req.params.attemptId).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.studentId) !== String(req.user._id) && !["Teacher", "School Admin", "Super Admin"].includes(req.userRole?.name)) {
    throw new ApiError(403, "Unauthorized");
  }
  res.json(new ApiResponse(200, attempt, "Attempt result"));
});

export const pendingEvaluation = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req, req.query.schoolId);
  const pending = await ExamModuleAttempt.find({ schoolId, evaluationStatus: { $in: ["pending", "partial"] }, status: { $in: ["submitted", "auto_submitted"] } }).sort({ submittedAt: 1 }).lean();
  res.json(new ApiResponse(200, pending, "Pending subjective evaluations"));
});

export const evaluationDetail = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findById(req.params.attemptId).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  const responses = await ExamModuleResponse.find({ examAttemptId: attempt._id }).populate("questionId", "questionText marks questionType").lean();
  res.json(new ApiResponse(200, { attempt, responses }, "Evaluation details"));
});

export const gradeSubjective = asyncHandler(async (req, res) => {
  const { evaluations = [] } = req.body;
  if (!Array.isArray(evaluations) || !evaluations.length) throw new ApiError(400, "evaluations array is required");
  const ops = evaluations.map((evalRow) => ({
    updateOne: {
      filter: { examAttemptId: req.params.attemptId, questionId: evalRow.questionId },
      update: {
        $set: {
          marksObtained: Number(evalRow.marksObtained || 0),
          evaluationStatus: "teacher_checked",
          isCorrect: evalRow.isCorrect ?? null,
          savedAt: new Date(),
        },
      },
    },
  }));
  await ExamModuleResponse.bulkWrite(ops, { ordered: false });
  res.json(new ApiResponse(200, { updated: evaluations.length }, "Subjective graded"));
});

export const finalizeEvaluation = asyncHandler(async (req, res) => {
  const attempt = await ExamModuleAttempt.findById(req.params.attemptId).lean();
  if (!attempt) throw new ApiError(404, "Attempt not found");
  const responses = await ExamModuleResponse.find({ examAttemptId: attempt._id }).lean();
  const pendingCount = responses.filter((item) => item.evaluationStatus === "pending").length;
  if (pendingCount) throw new ApiError(400, "Subjective evaluation pending");

  const total = responses.reduce((sum, item) => sum + Number(item.marksObtained || 0), 0);
  await ExamModuleAttempt.updateOne({ _id: attempt._id }, { $set: { evaluationStatus: "completed", status: "evaluated", totalScore: total } });
  res.json(new ApiResponse(200, { finalized: true, total }, "Evaluation finalized"));
});

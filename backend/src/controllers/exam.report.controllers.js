import { ExamAttempt } from "../models/ExamAttempts.model.js";
import { Exam } from "../models/Exam.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateGradingReport } from "../utils/gradingService.js";
import { exportToExcel, exportToPDF } from "../utils/exportService.js";

// =========================
// Get overall report for a specific exam
// =========================
export const getExamReport = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  if (!examId) {
    return res.status(400).json(new ApiResponse(400, null, "Exam ID is required"));
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }
  if (req.userRole?.name !== "Super Admin" && `${exam.schoolId}` !== `${req.user.schoolId}`) {
    return res.status(403).json(new ApiResponse(403, null, "Forbidden for this school exam"));
  }

  const attempts = await ExamAttempt.find({ examId, schoolId: exam.schoolId }).populate("studentId", "name email");

  return res.status(200).json(
    new ApiResponse(200, { exam, attempts }, "Exam report fetched successfully")
  );
});

// =========================
// Get student-wise report
// =========================
export const getStudentReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!studentId) {
    return res.status(400).json(new ApiResponse(400, null, "Student ID is required"));
  }

   const student = await User.findOne({ _id: studentId, isActive: true, isDeleted: { $ne: true } });
  if (!student) {
    return res.status(404).json(new ApiResponse(404, null, "Student not found"));
  }
  if (req.userRole?.name !== "Super Admin" && `${student.schoolId}` !== `${req.user.schoolId}`) {
    return res.status(403).json(new ApiResponse(403, null, "Forbidden for this school student"));
  }

  const attempts = await ExamAttempt.find({ studentId, schoolId: student.schoolId }).populate(
    "examId",
    "title subjectId"
  );

  return res.status(200).json(
    new ApiResponse(200, { student, attempts }, "Student report fetched successfully")
  );
});

// =========================
// Performance summary (all students in exam)
// =========================
export const getPerformanceSummary = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  if (!examId) {
    return res.status(400).json(new ApiResponse(400, null, "Exam ID is required"));
  }

  const exam = await Exam.findById(examId).select("schoolId");
  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }
  if (req.userRole?.name !== "Super Admin" && `${exam.schoolId}` !== `${req.user.schoolId}`) {
    return res.status(403).json(new ApiResponse(403, null, "Forbidden for this school exam"));
  }

  const attempts = await ExamAttempt.find({ examId, schoolId: exam.schoolId });
  if (!attempts.length) {
    return res.status(404).json(new ApiResponse(404, null, "No attempts found for this exam"));
  }

  const totalMarks = attempts.reduce((acc, attempt) => acc + (attempt.totalMarksObtained || 0), 0);
  const avgMarks = totalMarks / attempts.length;

  const summary = {
    totalAttempts: attempts.length,
    totalMarks,
    avgMarks,
    highest: Math.max(...attempts.map((a) => a.totalMarksObtained || 0)),
    lowest: Math.min(...attempts.map((a) => a.totalMarksObtained || 0)),
  };

  return res.status(200).json(
    new ApiResponse(200, summary, "Performance summary generated successfully")
  );
});

// =========================
// Get Reports (JSON)
// =========================
export const getReports = asyncHandler(async (req, res) => {
  const { examId, type } = req.query;
  const enforcedSchoolId = req.userRole?.name === "Super Admin" ? req.query.schoolId : req.user.schoolId;
  const reportData = await generateGradingReport({ examId, schoolId: enforcedSchoolId, type });
  return res.status(200).json(new ApiResponse(200, reportData, "Reports generated successfully"));
});

// =========================
// Export to Excel
// =========================
export const exportReportsExcel = asyncHandler(async (req, res) => {
  const { examId, type } = req.query;
  const enforcedSchoolId = req.userRole?.name === "Super Admin" ? req.query.schoolId : req.user.schoolId;
  const reportData = await generateGradingReport({ examId, schoolId: enforcedSchoolId, type });
  const fileBuffer = await exportToExcel(reportData);

  res.setHeader("Content-Disposition", "attachment; filename=exam_report.xlsx");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  return res.end(fileBuffer); // ✅ safer than res.send for binary
});

// =========================
// Export to PDF
// =========================
export const exportReportsPDF = asyncHandler(async (req, res) => {
  const { examId, type } = req.query;
  const enforcedSchoolId = req.userRole?.name === "Super Admin" ? req.query.schoolId : req.user.schoolId;
  const reportData = await generateGradingReport({ examId, schoolId: enforcedSchoolId, type });
  const fileBuffer = await exportToPDF(reportData);

  res.setHeader("Content-Disposition", "attachment; filename=exam_report.pdf");
  res.setHeader("Content-Type", "application/pdf");

  return res.end(fileBuffer);
});

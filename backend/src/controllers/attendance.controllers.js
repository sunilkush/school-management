import { Attendance } from "../models/attendance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
// ✅ Create Attendance
export const createAttendance = asyncHandler(async (req, res) => {
  const { 
    schoolId, academicYearId, date, session, 
    userId, role, status, remarks, 
    classId, sectionId, departmentId, subjectId 
  } = req.body;

  if (!schoolId || !academicYearId || !date || !userId || !role || !status) {
    throw new ApiError(400, "Required fields missing!");
  }

  const attendance = await Attendance.create({
    schoolId,
    academicYearId,
    date,
    session,
    userId,
    role,
    status,
    remarks,
    classId,
    sectionId,
    departmentId,
    subjectId,
    markedBy: req.user?._id,
    markedAt: new Date(),
  });

  return res.status(201).json(new ApiResponse(201, attendance, "Attendance created successfully"));
});

// ✅ Get Attendance (Filterable)
export const getAttendances = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, classId, sectionId, role, date } = req.query;

  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (role) filter.role = role;
  if (date) filter.date = new Date(date);

  const attendances = await Attendance.find(filter)
    .populate("userId", "fullName email")
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("departmentId", "name")
    .populate("subjectId", "name")
    .populate("markedBy", "fullName");

  return res.status(200).json(new ApiResponse(200, attendances, "Attendance list fetched successfully"));
});

// ✅ Update Attendance
export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await Attendance.findByIdAndUpdate(
    id,
    { ...req.body, updatedBy: req.user?._id, updatedAt: new Date() },
    { new: true }
  );

  if (!updated) throw new ApiError(404, "Attendance not found");

  return res.status(200).json(new ApiResponse(200, updated, "Attendance updated successfully"));
});

// ✅ Delete Attendance
export const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Attendance.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Attendance not found");

  return res.status(200).json(new ApiResponse(200, deleted, "Attendance deleted successfully"));
});

// ✅ Daily Report (By Date)
export const getDailyReport = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, date } = req.query;

  if (!schoolId || !academicYearId || !date) {
    throw new ApiError(400, "schoolId, academicYearId and date are required!");
  }

  const records = await Attendance.find({
    schoolId,
    academicYearId,
    date: new Date(date),
  }).populate("userId", "fullName email role");

  return res.status(200).json(new ApiResponse(200, records, "Daily Report fetched"));
});

// ✅ Monthly Report (By Month)
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, month, year } = req.query;

  if (!schoolId || !academicYearId || !month || !year) {
    throw new ApiError(400, "schoolId, academicYearId, month and year are required!");
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    schoolId,
    academicYearId,
    date: { $gte: start, $lte: end },
  }).populate("userId", "fullName email role");

  return res.status(200).json(new ApiResponse(200, records, "Monthly Report fetched"));
});

// ✅ Class-wise Monthly Report
export const getClassMonthlyReport = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, classId, sectionId, month, year } = req.query;

  if (!schoolId || !academicYearId || !classId || !month || !year) {
    throw new ApiError(400, "schoolId, academicYearId, classId, month and year are required!");
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    schoolId,
    academicYearId,
    classId,
    ...(sectionId && { sectionId }),
    date: { $gte: start, $lte: end },
  }).populate("userId", "fullName email role");

  return res.status(200).json(new ApiResponse(200, records, "Class Monthly Report fetched"));
});


// ✅ Export to Excel
export const exportAttendanceExcel = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, month, year } = req.query;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    schoolId,
    academicYearId,
    date: { $gte: start, $lte: end },
  }).populate("userId", "fullName email role");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");

  worksheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Role", key: "role", width: 15 },
    { header: "Date", key: "date", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Remarks", key: "remarks", width: 25 },
  ];

  records.forEach((rec) => {
    worksheet.addRow({
      name: rec.userId?.fullName,
      role: rec.role,
      date: rec.date.toISOString().split("T")[0],
      status: rec.status,
      remarks: rec.remarks || "",
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=attendance.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

// ✅ Export to PDF
export const exportAttendancePDF = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, month, year } = req.query;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    schoolId,
    academicYearId,
    date: { $gte: start, $lte: end },
  }).populate("userId", "fullName email role");

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=attendance.pdf");

  doc.pipe(res);

  doc.fontSize(16).text("Attendance Report", { align: "center" }).moveDown();

  records.forEach((rec) => {
    doc
      .fontSize(12)
      .text(`Name: ${rec.userId?.fullName} | Role: ${rec.role} | Date: ${rec.date.toISOString().split("T")[0]} | Status: ${rec.status}`)
      .moveDown(0.5);
  });

  doc.end();
});
import { Attendance } from "../models/attendance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";
// ✅ Create Attendance
export const createAttendance = asyncHandler(async (req, res) => {
  const {
    schoolId,
    academicYearId,
    date,
    session = "FullDay",
    role,
    remarks,
    classId,
    sectionId,
    departmentId,
    subjectId,
    records
  } = req.body;

  if (!schoolId || !academicYearId || !date || !role) {
    throw new ApiError(400, "Required fields missing!");
  }



  let attendanceDocs = [];

  // ✅ MULTIPLE STUDENT RECORDS
  if (records && records.length > 0) {
    attendanceDocs = records.map((rec) => ({
      schoolId,
      academicYearId,
      date,
      session,
      userId: rec.studentId,
      role: "Student",
      status:
        rec.status.charAt(0).toUpperCase() +
        rec.status.slice(1).toLowerCase(),
      classId,
      sectionId,
      subjectId,
      remarks,
      markedBy: req.user._id,
      markedAt: new Date(),
    }));
  }

  // ✅ INSERT MANY
  const attendance = await Attendance.insertMany(attendanceDocs, {
    ordered: false,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, attendance, "Attendance created successfully"));
});


// ✅ Get Attendance (Filterable)
export const getAttendances = asyncHandler(async (req, res) => {
  const { academicYearId, classId, sectionId, role, date } = req.query;

  let filter = {};
  if (academicYearId) filter.academicYearId = academicYearId;
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (role) filter.role = role;
  if (date) filter.date = new Date(date);

  filter = buildSchoolAccessFilter(req, filter);

  const attendances = await Attendance.find(filter)
    .populate("userId", "fullName email role")
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("departmentId", "name")
    .populate("subjectId", "name")
    .populate("markedBy", "fullName role");

  return res
    .status(200)
    .json(new ApiResponse(200, attendances, "Attendance list fetched"));
});


// ✅ Update Attendance
export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id);
  if (!attendance) throw new ApiError(404, "Attendance not found");

  // 🔐 Teacher can update only own marked records
  if (
    req.user.role === "TEACHER" &&
    attendance.markedBy.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not allowed to update this record");
  }

  const updated = await Attendance.findByIdAndUpdate(
    id,
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Attendance updated"));
});


// ✅ Delete Attendance
export const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id);
  if (!attendance) throw new ApiError(404, "Attendance not found");

  if (
    req.user.role === "TEACHER" &&
    attendance.markedBy.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not allowed to delete this record");
  }

  await attendance.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Attendance deleted"));
});


// ✅ Daily Report (By Date)
export const getDailyReport = asyncHandler(async (req, res) => {
  const { academicYearId, date } = req.query;
  if (!academicYearId || !date)
    throw new ApiError(400, "academicYearId and date required");

  let filter = {
    academicYearId,
    date: new Date(date),
  };

  filter = buildSchoolAccessFilter(req, filter);

  const records = await Attendance.find(filter).populate(
    "userId",
    "fullName role"
  );

  res.status(200).json(new ApiResponse(200, records, "Daily report"));
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
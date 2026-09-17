import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { Report } from "../models/Report.model.js";
import APIFeatures from "../utils/apiFeatures.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
const ensureSchoolAccess = (req, schoolId) => {
  if (req.userRole?.name === "Super Admin") return;
  if (req.user.schoolId?.toString() !== schoolId.toString()) {
    throw new ApiError(403, "Unauthorized school access");
  }
};

export const getSchoolOverviewReport = async (req, res, next) => {
  try {
    const { schoolId, academicYearId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schoolId)) throw new ApiError(400, "Invalid School ID");
    if (!mongoose.Types.ObjectId.isValid(academicYearId)) throw new ApiError(400, "Invalid Academic Year ID");

    ensureSchoolAccess(req, schoolId);
    
    const schoolObjId = new mongoose.Types.ObjectId(schoolId);
    const academicObjId = new mongoose.Types.ObjectId(academicYearId);
    const academicYear = await AcademicYear.findById(academicObjId);
    // A year of some other school would report this school's staff under that school's year name.
    if (!academicYear || String(academicYear.schoolId) !== String(schoolId)) throw new ApiError(404, "Academic Year not found");
    const roleWise = await User.aggregate([
      { $match: { schoolId: schoolObjId, isActive: true, isDeleted: { $ne: true } } },
      { $lookup: { from: "roles", localField: "roleId", foreignField: "_id", as: "roleData" } },
      { $unwind: "$roleData" },
      { $group: { _id: "$roleData.name", count: { $sum: 1 } } },
    ]);
    
    
    // Who studied in the school that year. Counting only "Active" gave a finished year no students
    // at all once its classes were promoted, and the class and gender splits counted everyone —
    // left and transferred too — so they never added up to the total beside them. All four now
    // count the same students: those still there, and those who finished the year.
    const studiedThatYear = {
      schoolId: schoolObjId,
      academicYearId: academicObjId,
      status: { $in: ["Active", "Promoted", "Alumni"] },
    };

    const totalStudents = await StudentEnrollment.countDocuments(studiedThatYear);

    const classWise = await StudentEnrollment.aggregate([
      { $match: studiedThatYear },
      { $lookup: { from: "schoolclasses", localField: "schoolClassId", foreignField: "_id", as: "classData" } },
      { $unwind: "$classData" },
      { $group: { _id: "$classData.name", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const sectionWise = await StudentEnrollment.aggregate([
      { $match: studiedThatYear },
      { $lookup: { from: "sections", localField: "sectionId", foreignField: "_id", as: "sectionData" } },
      { $unwind: "$sectionData" },
      { $group: { _id: "$sectionData.name", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Starts from this school's enrolments, not from every student on the platform.
    const genderStats = await StudentEnrollment.aggregate([
      { $match: studiedThatYear },
      { $lookup: { from: Student.collection.name, localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $group: { _id: "$student.gender", count: { $sum: 1 } } },
    ]);
    const genderMap = { Male: "Male", Female: "Female", Other: "Other" };
    const genderStatsFormatted = genderStats.map((g) => ({
      ...g,
      _id: genderMap[g._id] || g._id || null,
    }));
    

    return sendSuccess(res, {
      message: "School overview report fetched",
      data: {
        schoolId,
        academicYear: academicYear.name,
        summary: {
          adminCount: roleWise.find((x) => x._id === "School Admin")?.count || 0,
          teacherCount: roleWise.find((x) => x._id === "Teacher")?.count || 0,
          parentCount: roleWise.find((x) => x._id === "Parent")?.count || 0,
          studentCount: totalStudents,
        },
        roleWise,
        classWise,
        sectionWise,
        genderStats: genderStatsFormatted,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const reportQuery = req.userRole?.name === "Super Admin" ? Report.find() : Report.find({ school: req.user.schoolId });

    const features = new APIFeatures(
      // The list shows each report's session, so it has to be populated — it came back as a bare id
      // and every row read "-".
      reportQuery.populate("school", "name").populate("session", "name startDate endDate").populate("generatedBy", "name"),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reports = await features.query;

    return sendSuccess(res, {
      message: "Reports fetched",
      data: reports,
      meta: {
        page: Number(req.query.page || 1),
        total: reports.length,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const createReport = async (req, res, next) => {
  try {
    if (req.userRole?.name !== "Super Admin") {
      req.body.school = req.user.schoolId;
    }

    const newReport = await Report.create({ ...req.body, generatedBy: req.user._id });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Report created",
      data: newReport,
    });
  } catch (err) {
    return next(err);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) throw new ApiError(404, "Report not found");
    // School Admin is in REPORT_DELETE (report.routes.js) but this had no ownership check at
    // all — any school's report could be deleted by ID.
    ensureSchoolAccess(req, report.school);

    await report.deleteOne();

    return sendSuccess(res, { message: "Report deleted", data: null });
  } catch (err) {
    return next(err);
  }
};

export const viewReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("school", "name")
      .populate("session", "name startDate endDate")
      .populate("generatedBy", "name");

    if (!report) throw new ApiError(404, "Report not found");
    if (req.userRole?.name !== "Super Admin") ensureSchoolAccess(req, report.school);

    return sendSuccess(res, { message: "Report fetched", data: report });
  } catch (err) {
    return next(err);
  }
};

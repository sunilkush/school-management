import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { Report } from "../models/Report.model.js";
import APIFeatures from "../utils/apiFeatures.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";

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

    const roleWise = await User.aggregate([
      { $match: { schoolId: schoolObjId } },
      { $lookup: { from: "roles", localField: "roleId", foreignField: "_id", as: "roleData" } },
      { $unwind: "$roleData" },
      { $group: { _id: "$roleData.name", count: { $sum: 1 } } },
    ]);

    const totalStudents = await StudentEnrollment.countDocuments({
      schoolId: schoolObjId,
      academicYearId: academicObjId,
      status: "Active",
    });

    const classWise = await StudentEnrollment.aggregate([
      { $match: { schoolId: schoolObjId, academicYearId: academicObjId } },
      { $lookup: { from: "classes", localField: "schoolClassId", foreignField: "_id", as: "classData" } },
      { $unwind: "$classData" },
      { $group: { _id: "$classData.name", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const sectionWise = await StudentEnrollment.aggregate([
      { $match: { schoolId: schoolObjId, academicYearId: academicObjId } },
      { $lookup: { from: "sections", localField: "sectionId", foreignField: "_id", as: "sectionData" } },
      { $unwind: "$sectionData" },
      { $group: { _id: "$sectionData.name", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const genderStats = await Student.aggregate([
      { $lookup: { from: "studentenrollments", localField: "_id", foreignField: "studentId", as: "enroll" } },
      { $unwind: "$enroll" },
      { $match: { "enroll.schoolId": schoolObjId, "enroll.academicYearId": academicObjId } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    return sendSuccess(res, {
      message: "School overview report fetched",
      data: {
        schoolId,
        academicYearId,
        summary: {
          adminCount: roleWise.find((x) => x._id === "School Admin")?.count || 0,
          teacherCount: roleWise.find((x) => x._id === "Teacher")?.count || 0,
          parentCount: roleWise.find((x) => x._id === "Parent")?.count || 0,
          studentCount: totalStudents,
        },
        roleWise,
        classWise,
        sectionWise,
        genderStats,
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
      reportQuery.populate("school", "name").populate("generatedBy", "name"),
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
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) throw new ApiError(404, "Report not found");

    return sendSuccess(res, { message: "Report deleted", data: null });
  } catch (err) {
    return next(err);
  }
};

export const viewReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate("school", "name").populate("generatedBy", "name");

    if (!report) throw new ApiError(404, "Report not found");
    if (req.userRole?.name !== "Super Admin") ensureSchoolAccess(req, report.school);

    return sendSuccess(res, { message: "Report fetched", data: report });
  } catch (err) {
    return next(err);
  }
};

import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { Role } from "../models/Roles.model.js";
import {Class} from "../models/classes.model.js";
import { Section } from "../models/section.model.js";

export const getSchoolOverviewReport = async (req, res) => {
  try {
    const { schoolId, academicYearId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ success: false, message: "Invalid School ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
      return res.status(400).json({ success: false, message: "Invalid Academic Year ID" });
    }

    const schoolObjId = new mongoose.Types.ObjectId(schoolId);
    const academicObjId = new mongoose.Types.ObjectId(academicYearId);

    // ----------------------------
    // 1️⃣ ROLE WISE USER COUNTS
    // ----------------------------
    const roleWise = await User.aggregate([
      { $match: { schoolId: schoolObjId } },

      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "roleData",
        },
      },
      { $unwind: "$roleData" },

      {
        $group: {
          _id: "$roleData.name", // School Admin/Teacher/Parent/Student
          count: { $sum: 1 },
        },
      },
    ]);

    const adminCount = roleWise.find((x) => x._id === "School Admin")?.count || 0;
    const teacherCount = roleWise.find((x) => x._id === "Teacher")?.count || 0;
    const parentCount = roleWise.find((x) => x._id === "Parent")?.count || 0;
    const studentCount = roleWise.find((x) => x._id === "Student")?.count || 0;

    // ----------------------------
    // 2️⃣ TOTAL STUDENT COUNT (ENROLLMENT)
    // ----------------------------
    const totalStudents = await StudentEnrollment.countDocuments({
      schoolId: schoolObjId,
      academicYearId: academicObjId,
      status: "Active",
    });

    // ----------------------------
    // 3️⃣ CLASS WISE STUDENT COUNTS
    // ----------------------------
    const classWise = await StudentEnrollment.aggregate([
      {
        $match: {
          schoolId: schoolObjId,
          academicYearId: academicObjId,
        },
      },

      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classData",
        },
      },
      { $unwind: "$classData" },

      {
        $group: {
          _id: "$classData.name",
          count: { $sum: 1 },
        },
      },

      { $sort: { _id: 1 } },
    ]);

    // ----------------------------
    // 4️⃣ SECTION WISE STUDENT COUNTS
    // ----------------------------
    const sectionWise = await StudentEnrollment.aggregate([
      {
        $match: {
          schoolId: schoolObjId,
          academicYearId: academicObjId,
        },
      },

      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionData",
        },
      },
      { $unwind: "$sectionData" },

      {
        $group: {
          _id: "$sectionData.name",
          count: { $sum: 1 },
        },
      },

      { $sort: { _id: 1 } },
    ]);

    // ----------------------------
    // 5️⃣ GENDER ANALYSIS
    // ----------------------------
    const genderStats = await Student.aggregate([
      {
        $lookup: {
          from: "studentenrollments", // FIXED COLLECTION NAME
          localField: "_id",
          foreignField: "studentId",
          as: "enroll",
        },
      },

      { $unwind: "$enroll" },

      {
        $match: {
          "enroll.schoolId": schoolObjId,
          "enroll.academicYearId": academicObjId,
        },
      },

      {
        $group: {
          _id: "$gender", // Male/Female/Other
          count: { $sum: 1 },
        },
      },
    ]);

    // ----------------------------
    // 6️⃣ FINAL RESPONSE
    // ----------------------------
    return res.status(200).json({
      success: true,
      schoolId,
      academicYearId,

      summary: {
        adminCount,
        teacherCount,
        parentCount,
        studentCount: totalStudents,
      },

      roleWise,
      classWise,
      sectionWise,
      genderStats,
    });
  } catch (error) {
   
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


import { Report } from "../models/Report.model.js";
import APIFeatures from "../utils/apiFeatures.js";

// @desc Get all reports with filtering, sorting, field limiting, pagination
export const getReport = async (req, res) => {
  try {
    // Build query using APIFeatures
    const features = new APIFeatures(
      Report.find()
        .populate("school", "name")
        .populate("generatedBy", "name"),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reports = await features.query;

    res.status(200).json({
      status: "success",
      results: reports.length,
      data: reports,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// @desc Create report
export const createReport = async (req, res) => {
  try {
    const newReport = await Report.create({
      ...req.body,
      generatedBy: req.user._id, // from auth middleware
    });

    res.status(201).json({
      status: "success",
      data: newReport,
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// @desc Delete report
export const deleteReport = async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Report not found" });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const viewReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("school", "name")
      .populate("generatedBy", "name");

    if (!report) {
      return res.status(404).json({ status: "error", message: "Report not found" });
    }

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { Role } from "../models/Roles.model.js";
import Class from "../models/classes.model.js";
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

    // ----------------------------
    // 1️⃣ ROLE WISE USER COUNTS
    // ----------------------------
    const roleWise = await User.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },

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
          _id: "$roleData.name", // admin / teacher / parent
          count: { $sum: 1 },
        },
      },
    ]);

    // Extract specific role-wise
    const adminCount =
      roleWise.find((x) => x._id?.toLowerCase() === "admin")?.count || 0;

    const teacherCount =
      roleWise.find((x) => x._id?.toLowerCase() === "teacher")?.count || 0;

    const parentCount =
      roleWise.find((x) => x._id?.toLowerCase() === "parent")?.count || 0;

    // ----------------------------
    // 2️⃣ TOTAL STUDENT COUNT (ENROLLMENT)
    // ----------------------------
    const totalStudents = await StudentEnrollment.countDocuments({
      schoolId,
      academicYearId,
      status: "Active",
    });

    // ----------------------------
    // 3️⃣ CLASS WISE STUDENT COUNTS
    // ----------------------------
    const classWise = await StudentEnrollment.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          academicYearId: new mongoose.Types.ObjectId(academicYearId),
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
          schoolId: new mongoose.Types.ObjectId(schoolId),
          academicYearId: new mongoose.Types.ObjectId(academicYearId),
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
          _id: "$sectionData.name", // A/B/C
          count: { $sum: 1 },
        },
      },

      { $sort: { _id: 1 } },
    ]);

    // ----------------------------
    // 5️⃣ GENDER ANALYSIS (FROM STUDENT COLLECTION)
    // ----------------------------
    const genderStats = await Student.aggregate([
      {
        $lookup: {
          from: "StudentEnrollments",
          localField: "_id",
          foreignField: "studentId",
          as: "enroll",
        },
      },

      { $unwind: "$enroll" },

      {
        $match: {
          "enroll.schoolId": new mongoose.Types.ObjectId(schoolId),
          "enroll.academicYearId": new mongoose.Types.ObjectId(academicYearId),
        },
      },

      {
        $group: {
          _id: "$gender",
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
    console.log("Report Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

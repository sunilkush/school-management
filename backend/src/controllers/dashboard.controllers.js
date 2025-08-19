import mongoose from "mongoose";
import { Classes } from "../models/classes.model.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Fees } from "../models/fees.model.js";
import { Role } from "../models/Roles.model.js";
import { Attendance } from "../models/attendance.model.js";
import { School } from "../models/school.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const ObjectId = mongoose.Types.ObjectId;

export const getDashboardSummary = async (req, res) => {
  try {
    const { role, schoolId } = req.query;
    let response = {};

    // 🔹 Ensure schoolId for School Admin
    if (role === "School Admin" && !schoolId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "School ID is missing for School Admin"));
    }

    // 🔹 Fetch roles safely (case insensitive)
    const teacherRole = await Role.findOne({ name: { $regex: /^teacher$/i } });
    const studentRole = await Role.findOne({ name: { $regex: /^student$/i } });
    const schoolAdminRole = await Role.findOne({ name: { $regex: /^school admin$/i } });

    const teacherRoleId = teacherRole?._id;
    const studentRoleId = studentRole?._id;
    const schoolAdminRoleId = schoolAdminRole?._id;

    if (!teacherRoleId || !studentRoleId || !schoolAdminRoleId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Roles not configured properly (Teacher/Student/School Admin)"
          )
        );
    }

    // ========= SUPER ADMIN DASHBOARD =========
    if (role === "Super Admin") {
      const [totalSchools, totalAdmin, totalUsers, totalFees] =
        await Promise.all([
          School.countDocuments(),
          User.countDocuments({ roleId: schoolAdminRoleId }),
          User.countDocuments(),
          Fees.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
        ]);

      response = {
        schools: totalSchools,
        admins: totalAdmin,
        users: totalUsers,
        feesCollected: totalFees[0]?.total || 0,
      };
    }

    // ========= SCHOOL ADMIN DASHBOARD =========
    else if (role === "School Admin") {
      const schoolObjectId = new ObjectId(schoolId);

      const [totalClasses, totalTeachers, totalStudents, feesCollected] =
        await Promise.all([
          Classes.countDocuments({ schoolId: schoolObjectId }),
          User.countDocuments({ schoolId: schoolObjectId, roleId: teacherRoleId }),
          Student.countDocuments({ schoolId: schoolObjectId }),
          Fees.aggregate([
            { $match: { schoolId: schoolObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);

      response = {
        classes: totalClasses,
        teachers: totalTeachers,
        students: totalStudents,
        feesCollected: feesCollected[0]?.total || 0,
      };
    }

    // ========= TEACHER DASHBOARD =========
    else if (role === "Teacher") {
      const teacherId = new ObjectId(req.user._id);

      const teacherClasses = await Classes.find({ teacher: teacherId }).select("_id");

      const [studentsCount, attendance] = await Promise.all([
        Student.countDocuments({
          classId: { $in: teacherClasses.map((c) => c._id) },
        }),
        Attendance.aggregate([
          { $match: { teacherId: teacherId } },
          { $group: { _id: null, totalMarked: { $sum: 1 } } },
        ]),
      ]);

      response = {
        students: studentsCount,
        attendanceMarked: attendance[0]?.totalMarked || 0,
      };
    }

    // ========= DEFAULT =========
    else {
      response = { message: "Dashboard not available for this role" };
    }

    return res.status(200).json(
      new ApiResponse(200, response, `${role} dashboard summary fetched successfully`)
    );
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

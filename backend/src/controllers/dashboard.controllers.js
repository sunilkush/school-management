import mongoose from "mongoose";
import { Classes } from "../models/classes.model.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Fees } from "../models/fees.model.js";
import { Role } from "../models/Roles.model.js";
import { Attendance } from "../models/attendance.model.js";
import { School } from "../models/school.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const { role, schoolId } = req.query; // ✅ frontend sends query params
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

    const teacherRoleId = teacherRole?.id;
    const studentRoleId = studentRole?.id;

    if (!teacherRoleId || !studentRoleId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Roles not configured properly (Teacher/Student)"));
    }

    // ========= SUPER ADMIN DASHBOARD =========
    if (role === "Super Admin") {
      const [totalSchools, totalTeachers, totalStudents, totalFees] = await Promise.all([
        School.countDocuments(),
        User.countDocuments({ roleId: teacherRoleId }), // 👈 or role: teacherRoleId (check schema)
        Student.countDocuments(),
        Fees.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      ]);

      response = {
        schools: totalSchools,
        teachers: totalTeachers,
        students: totalStudents,
        feesCollected: totalFees[0]?.total || 0,
      };
    }

    // ========= SCHOOL ADMIN DASHBOARD =========
    else if (role === "School Admin") {
      const [totalClasses, totalTeachers, totalStudents, feesCollected] = await Promise.all([
        Classes.countDocuments({ schoolId: schoolId }),
        User.countDocuments({ schoolId: schoolId, roleId: teacherRoleId }),
        Student.countDocuments({ schoolId: schoolId }),
        Fees.aggregate([
          { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
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
      const teacherId = req.user._id;

      const teacherClasses = await Classes.find({ teacher: teacherId }).select("_id");

      const [studentsCount, attendance] = await Promise.all([
        Student.countDocuments({ classId: { $in: teacherClasses.map(c => c._id) } }),
        Attendance.aggregate([
          { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
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

    return res.status(200).json(new ApiResponse(200, response, "Dashboard summary fetched successfully"));
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

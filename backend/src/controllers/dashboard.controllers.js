import mongoose from "mongoose";
import { Class } from "../models/classes.model.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Fees } from "../models/fees.model.js";
import { Role } from "../models/Roles.model.js";
import { Attendance } from "../models/attendance.model.js";
import { School } from "../models/school.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ObjectId = mongoose.Types.ObjectId;

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const roleName = req.userRole?.name || req.query.role;
  const userSchoolId = req.user?.schoolId?._id || req.user?.schoolId;
  const schoolId = req.query.schoolId || userSchoolId;

  if (!roleName) {
    throw new ApiError(400, "Role is required to fetch dashboard summary");
  }

  let response = {};

  const teacherRole = await Role.findOne({ name: { $regex: /^teacher$/i } });
  const studentRole = await Role.findOne({ name: { $regex: /^student$/i } });
  const schoolAdminRole = await Role.findOne({ name: { $regex: /^school admin$/i } });

  const teacherRoleId = teacherRole?._id;
  const studentRoleId = studentRole?._id;
  const schoolAdminRoleId = schoolAdminRole?._id;

  if (!teacherRoleId || !studentRoleId || !schoolAdminRoleId) {
    throw new ApiError(
      400,
      "Roles not configured properly (Teacher/Student/School Admin)"
    );
  }

  if (roleName === "Super Admin") {
    const [totalSchools, totalAdmin, totalUsers, totalFees] = await Promise.all([
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
  } else if (roleName === "School Admin") {
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new ApiError(400, "Valid schoolId is required for School Admin dashboard");
    }

    const schoolObjectId = new ObjectId(schoolId);

    const [totalClasses, totalTeachers, totalStudents, feesCollected] = await Promise.all([
      Class.countDocuments({ schoolId: schoolObjectId }),
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
  } else if (roleName === "Teacher") {
    const teacherId = new ObjectId(req.user._id);

    const teacherClasses = await Class.find({ teacher: teacherId }).select("_id");

    const [studentsCount, attendance] = await Promise.all([
      Student.countDocuments({
        schoolClassId: { $in: teacherClasses.map((classItem) => classItem._id) },
      }),
      Attendance.aggregate([
        { $match: { teacherId } },
        { $group: { _id: null, totalMarked: { $sum: 1 } } },
      ]),
    ]);

    response = {
      students: studentsCount,
      attendanceMarked: attendance[0]?.totalMarked || 0,
    };
  } else {
    response = { message: "Dashboard not available for this role" };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, `${roleName} dashboard summary fetched successfully`));
});

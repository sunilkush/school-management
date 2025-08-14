import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { School } from "../models/school.model.js";
import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { Fees } from "../models/fees.model.js";
import { Classes } from "../models/classes.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Role } from "../models/Roles.model.js";

const getDashboardSummary = asyncHandler(async (req, res) => {
    try {
        const role = req.query.role;
        const userSchoolId = req.query.schoolId;

        if (!role) {
            return res.status(400).json(new ApiResponse(400, null, "User role is missing"));
        }

        let response = {};

        // ✅ Get Role IDs for Teacher, Student, Admin
        
        if (!teacherRole || !studentRole || !adminRole) {
            return res.status(404).json(new ApiResponse(404, null, "Required roles not found"));
        }

        const teacherRoleId = new mongoose.Types.ObjectId("686611d4a9aa3ea4abfb25d7");
        const studentRoleId = new mongoose.Types.ObjectId("686611d4a9aa3ea4abfb25d7");
        const adminRoleId = new mongoose.Types.ObjectId("6866111fa9aa3ea4abfb2458");

        if (role === "Super Admin") {
            const [totalSchools, totalTeachers, totalAdmins, feesCollected] = await Promise.all([
                School.countDocuments(),
                User.countDocuments({
                    $or: [{ role: teacherRoleId }, { "role._id": teacherRoleId }]
                }),
                User.countDocuments({
                    $or: [{ role: adminRoleId }, { "role._id": adminRoleId }]
                }),
                Fees.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
            ]);

            response = {
                schools: totalSchools,
                teachers: totalTeachers,
                admins: totalAdmins,
                feesCollected: feesCollected[0]?.total || 0
            };
        }

        else if (role === "School Admin") {
            if (!userSchoolId) {
                return res.status(400).json(new ApiResponse(400, null, "School ID is missing for School Admin"));
            }

            const [totalClasses, totalTeachers, totalStudents, feesCollected] = await Promise.all([
                Classes.countDocuments({
                    $or: [{ school: userSchoolId }, { "school._id": userSchoolId }]
                }),
                User.countDocuments({
                    $and: [
                        { $or: [{ school: userSchoolId }, { "school._id": userSchoolId }] },
                        { $or: [{ role: teacherRoleId }, { "role._id": teacherRoleId }] }
                    ]
                }),
                User.countDocuments({
                    $and: [
                        { $or: [{ school: userSchoolId }, { "school._id": userSchoolId }] },
                        { $or: [{ role: studentRoleId }, { "role._id": studentRoleId }] }
                    ]
                }),
                Fees.aggregate([
                    { $match: { schoolId: userSchoolId } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ])
            ]);

            response = {
                classes: totalClasses,
                teachers: totalTeachers,
                students: totalStudents,
                feesCollected: feesCollected[0]?.total || 0
            };
        }

        else if (role === "Teacher") {
            const teacherId = req.user?._id || req.query.teacherId;
            const todayDate = new Date().toISOString().split("T")[0];

            const [totalClasses, studentsInClass, presentCount, totalCount] = await Promise.all([
                Classes.countDocuments({ teacherId }),
                Student.countDocuments({ classTeacherId: teacherId }),
                Attendance.countDocuments({ teacherId, date: todayDate, status: "Present" }),
                Attendance.countDocuments({ teacherId, date: todayDate })
            ]);

            const attendancePercent = totalCount > 0
                ? Math.round((presentCount / totalCount) * 100)
                : 0;

            response = {
                classes: totalClasses,
                students: studentsInClass,
                presentPercent: attendancePercent
            };
        }

        res.json(new ApiResponse(200, response, "Dashboard summary retrieved successfully"));

    } catch (error) {
        res.status(500).json(
            new ApiResponse(500, null, "Error retrieving dashboard summary", error.message)
        );
    }
});

export { getDashboardSummary };

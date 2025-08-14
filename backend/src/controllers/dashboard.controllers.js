import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { School } from "../models/school.model.js";
import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { Fees } from "../models/fees.model.js";
import { Classes } from "../models/classes.model.js";
import { Attendance } from "../models/attendance.model.js";

const getDashboardSummary = asyncHandler(async (req, res) => {
    try {
        // Get role and schoolId from query params (or token)
        const role = req.query.role; // ✅ fixed
        const userSchoolId = req.query.schoolId;

        if (!role) {
            return res.status(400).json(new ApiResponse(400, null, "User role is missing"));
        }

        let response = {};

        if (role === "Super Admin") {
            const [totalSchools, totalStudents, totalTeachers, feesCollected] = await Promise.all([
                School.countDocuments(),
                Student.countDocuments(),
                User.countDocuments({ role: "Teacher" }), // ✅ only teachers
                Fees.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
            ]);

            response = {
                students: totalStudents,
                teachers: totalTeachers,
                feesCollected: feesCollected[0]?.total || 0,
                schools: totalSchools
            };
        } 
        else if (role === "School Admin") {
            if (!userSchoolId) {
                return res.status(400).json(new ApiResponse(400, null, "School ID is missing for School Admin"));
            }

            const [totalClasses,totalStudents, totalTeachers, feesCollected,] = await Promise.all([
                Classes.countDocuments({ schoolId: userSchoolId }),
                Student.countDocuments({ schoolId: userSchoolId }),
                User.countDocuments({ schoolId: userSchoolId, role: "Teacher" }),
                Fees.aggregate([
                    { $match: { schoolId: userSchoolId } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ])
            ]);

            response = {
                classes: totalClasses,
                students: totalStudents,
                teachers: totalTeachers,
                feesCollected: feesCollected[0]?.total || 0
            };
        } 
        else if (role === "Teacher") {
            const teacherId = req.user?._id || req.query.teacherId; // ✅ fallback to query param
            const today = new Date();
            const todayDate = today.toISOString().split("T")[0];

            const [totalClasses, studentsInClass, presentCount, totalCount] = await Promise.all([
                Classes.countDocuments({ teacherId }),
                Student.countDocuments({ classTeacherId: teacherId }),
                Attendance.countDocuments({ teacherId, date: todayDate, status: "Present" }),
                Attendance.countDocuments({ teacherId, date: todayDate })
            ]);

            const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

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

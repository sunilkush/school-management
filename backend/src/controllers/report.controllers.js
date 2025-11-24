import { User } from "../models/user.model.js";
import { School } from "../models/school.model.js";

import mongoose from "mongoose";

// ------------------------
// SCHOOL OVERVIEW REPORT
// ------------------------
export const getSchoolOverviewReport = async (req, res) => {
  try {
    const { schoolId, academicYearId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Academic Year ID",
      });
    }

    // Check school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    // ------------------------
    // AGGREGATION PIPELINE
    // ------------------------
    const report = await User.aggregate([
      {
        $match: {
          school: new mongoose.Types.ObjectId(schoolId),
          academicYear: new mongoose.Types.ObjectId(academicYearId)
        },
      },

      {
        $facet: {
          // TOTAL USERS
          totalUsers: [
            { $count: "count" }
          ],

          // ACTIVE / INACTIVE
          activeStatus: [
            {
              $group: {
                _id: "$isActive",
                count: { $sum: 1 }
              }
            }
          ],

          // ROLE WISE COUNT (Admin, Teacher, Student, Parent)
          roleWise: [
            {
              $lookup: {
                from: "roles",
                localField: "role",
                foreignField: "_id",
                as: "roleData"
              }
            },
            { $unwind: "$roleData" },
            {
              $group: {
                _id: "$roleData.level",
                count: { $sum: 1 }
              }
            }
          ],

          // GENDER GRAPH
          genderStats: [
            {
              $group: {
                _id: "$gender",
                count: { $sum: 1 }
              }
            }
          ],

          // CLASS WISE STUDENT COUNT (For Student Reports)
          classWiseStudents: [
            {
              $match: {
                classAssigned: { $exists: true, $ne: null }
              }
            },
            {
              $lookup: {
                from: "classes",
                localField: "classAssigned",
                foreignField: "_id",
                as: "classData"
              }
            },
            { $unwind: "$classData" },
            {
              $group: {
                _id: "$classData.name",
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],

          // DEPARTMENT WISE EMPLOYEES
          departmentWise: [
            {
              $match: {
                department: { $exists: true, $ne: null }
              }
            },
            {
              $lookup: {
                from: "departments",
                localField: "department",
                foreignField: "_id",
                as: "deptData"
              }
            },
            { $unwind: "$deptData" },
            {
              $group: {
                _id: "$deptData.name",
                count: { $sum: 1 }
              }
            }
          ],
        }
      },

      // Format Output
      {
        $project: {
          totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] },
          activeStatus: 1,
          roleWise: 1,
          genderStats: 1,
          classWiseStudents: 1,
          departmentWise: 1,
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      school: school.name,
      academicYearId,
      report: report[0],
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


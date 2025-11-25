import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { Role } from "../models/Roles.model.js";
import  Class  from "../models/classes.model.js";
import { Section } from "../models/section.model.js";
import { School } from "../models/school.model.js";

export const getSchoolOverviewReport = async (req, res) => {
  try {
    const { schoolId, academicYearId } = req.params;

    const sId = new mongoose.Types.ObjectId(schoolId);
    const aId = new mongoose.Types.ObjectId(academicYearId);

    // SCHOOL CHECK
    const school = await School.findById(sId);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    // -------------------------------
    // 📌 1) TEACHER / ADMIN / PARENT COUNT (from USER)
    // -------------------------------
    const roleCounts = await User.aggregate([
      {
        $match: {
          school: sId,
          academicYear: aId
        }
      },
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
    ]);

    // Convert array → object
    const roleWise = roleCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // -------------------------------
    // 📌 2) TOTAL STUDENTS (from StudentEnrollment)
    // -------------------------------
    const studentCount = await StudentEnrollment.countDocuments({
      school: sId,
      academicYear: aId
    });

    // -------------------------------
    // 📌 3) CLASS-WISE STUDENT COUNT
    // -------------------------------
    const classWise = await StudentEnrollment.aggregate([
      {
        $match: {
          school: sId,
          academicYear: aId
        }
      },
      {
        $lookup: {
          from: "classes",
          localField: "class",
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
    ]);

    // -------------------------------
    // 📌 4) SECTION-WISE STUDENT COUNT
    // -------------------------------
    const sectionWise = await StudentEnrollment.aggregate([
      {
        $match: {
          school: sId,
          academicYear: aId
        }
      },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "sectionData"
        }
      },
      { $unwind: "$sectionData" },
      {
        $group: {
          _id: "$sectionData.name",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // -------------------------------
    // 📌 5) GENDER STATS (from Student)
    // -------------------------------
    const genderStats = await Student.aggregate([
      {
        $match: {
          school: sId
        }
      },
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 }
        }
      }
    ]);

    // -------------------------------
    // 📌 FINAL RESPONSE
    // -------------------------------
    return res.status(200).json({
      success: true,
      school: school.name,
      academicYearId,
      report: {
        teachers: roleWise.teacher || 0,
        admins: roleWise.admin || 0,
        parents: roleWise.parent || 0,
        students: studentCount,

        roleWise,

        classWise,
        sectionWise,
        genderStats
      }
    });

  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

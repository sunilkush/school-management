import mongoose from "mongoose";
import { Attendance } from "../models/attendance.model.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Employee } from "../models/Employee.model.js";
import { School } from "../models/school.model.js";
import { Exam } from "../models/Exam.model.js";
import { Subject } from "../models/subject.model.js";
import { Payment } from "../models/payment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const countByRoleName = (roleName, schoolId) =>
  User.aggregate([
    { $lookup: { from: "roles", localField: "roleId", foreignField: "_id", as: "r" } },
    { $unwind: "$r" },
    {
      $match: {
        isActive: true,
        "r.name": roleName,
        ...(schoolId && { schoolId: new mongoose.Types.ObjectId(schoolId) }),
      },
    },
    { $count: "n" },
  ]).then((res) => res[0]?.n || 0);

/* ── ATTENDANCE SUMMARY ──────────────────────────────────────────────────── */
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const userRole = req.userRole?.name || req.user?.role?.name;
  const isSchoolScoped = userRole && userRole !== "Super Admin";
  const schoolId = req.query.schoolId || (isSchoolScoped ? (req.user.school?._id || req.user.schoolId)?.toString() : null);

  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const matchFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
  if (schoolId) matchFilter.schoolId = new mongoose.Types.ObjectId(schoolId);

  const [attendanceStats, totalStudents, schoolStats] = await Promise.all([
    Attendance.aggregate([
      { $match: { ...matchFilter, role: "student" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Student.countDocuments({ ...(schoolId && { schoolId: new mongoose.Types.ObjectId(schoolId) }) }),
    School.aggregate([
      ...(schoolId ? [{ $match: { _id: new mongoose.Types.ObjectId(schoolId) } }] : []),
      {
        $lookup: {
          from: "attendances",
          let: { sid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$schoolId", "$$sid"] },
                date: { $gte: startOfDay, $lte: endOfDay },
                role: "student",
              },
            },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          as: "attendanceBreakdown",
        },
      },
      {
        $project: {
          name: 1,
          attendanceBreakdown: 1,
        },
      },
      { $limit: 200 },
    ]),
  ]);

  const statsMap = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0 };
  attendanceStats.forEach((s) => {
    if (statsMap[s._id] !== undefined) statsMap[s._id] = s.count;
  });

  const totalMarked = Object.values(statsMap).reduce((a, b) => a + b, 0);
  const attendanceRate =
    totalMarked > 0 ? Math.round((statsMap.present / totalMarked) * 100) : 0;

  /* Normalize schoolStats into flat objects for the frontend table */
  const normalizedSchoolStats = schoolStats.map((school) => {
    const breakdown = { present: 0, absent: 0, late: 0, leave: 0 };
    (school.attendanceBreakdown || []).forEach((b) => {
      if (breakdown[b._id] !== undefined) breakdown[b._id] = b.count;
    });
    const totalM = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const rate   = totalM > 0 ? Math.round((breakdown.present / totalM) * 100) : 0;
    return {
      schoolId:       school._id,
      schoolName:     school.name,
      present:        breakdown.present,
      absent:         breakdown.absent,
      late:           breakdown.late,
      attendanceRate: rate,
    };
  });

  res.status(200).json(
    new ApiResponse(200, {
      date: startOfDay,
      totalStudents,
      presentToday: statsMap.present,
      absentToday: statsMap.absent,
      lateToday: statsMap.late,
      halfdayToday: statsMap.halfday,
      leaveToday: statsMap.leave,
      onLeave: statsMap.leave,
      totalMarked,
      attendanceRate,
      schoolStats: normalizedSchoolStats,
    }, "Attendance summary fetched")
  );
});

/* ── FINANCE SUMMARY ─────────────────────────────────────────────────────── */
export const getFinanceSummary = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  // Non-Super-Admin is always locked to their school
  const schoolId = isSuperAdmin ? req.query.schoolId : req.user.schoolId;
  const { year } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const startDate = new Date(`${currentYear}-04-01`);
  const endDate = new Date(`${currentYear + 1}-03-31`);

  const matchFilter = { createdAt: { $gte: startDate, $lte: endDate } };
  if (schoolId) matchFilter.schoolId = new mongoose.Types.ObjectId(schoolId);

  const [feeCollection, schoolBreakdown, totalSchools] = await Promise.all([
    Payment.aggregate([
      { $match: { ...matchFilter, status: "completed" } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { ...matchFilter, status: "completed" } },
      {
        $group: {
          _id: "$schoolId",
          totalCollected: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "school",
        },
      },
      { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          schoolName: "$school.name",
          totalCollected: 1,
          paymentCount: 1,
        },
      },
      { $sort: { totalCollected: -1 } },
      { $limit: 200 },
    ]),
    School.countDocuments({ isActive: true }),
  ]);

  const totalIncome = feeCollection[0]?.totalCollected || 0;

  res.status(200).json(
    new ApiResponse(200, {
      year: currentYear,
      totalIncome,
      totalSchools,
      paymentCount: feeCollection[0]?.count || 0,
      topSchools: schoolBreakdown,
    }, "Finance summary fetched")
  );
});

/* ── ACADEMIC SUMMARY ────────────────────────────────────────────────────── */
export const getAcademicSummary = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  // Non-Super-Admin is always locked to their school
  const schoolId = isSuperAdmin ? req.query.schoolId : req.user.schoolId;
  const userFilter = { isActive: true };
  if (schoolId) userFilter.schoolId = new mongoose.Types.ObjectId(schoolId);

  const [totalStudents, totalTeachers, totalSubjects, totalExams, schoolCount] =
    await Promise.all([
      Student.countDocuments({ ...(schoolId && { schoolId: new mongoose.Types.ObjectId(schoolId) }) }),
      countByRoleName("Teacher", schoolId),
      Subject.countDocuments(schoolId ? { schoolId } : {}),
      Exam.countDocuments(schoolId ? { schoolId } : {}),
      School.countDocuments({ isActive: true }),
    ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalExams,
      totalSchools: schoolCount,
    }, "Academic summary fetched")
  );
});

/* ── PLATFORM OVERVIEW ───────────────────────────────────────────────────── */
export const getPlatformOverview = asyncHandler(async (req, res) => {
  const [totalSchools, activeSchools, totalStudents, totalTeachers] =
    await Promise.all([
      School.countDocuments(),
      School.countDocuments({ isActive: true, status: "active" }),
      Student.countDocuments(),
      countByRoleName("Teacher", null),
    ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalSchools,
      activeSchools,
      inactiveSchools: totalSchools - activeSchools,
      totalStudents,
      totalTeachers,
    }, "Platform overview fetched")
  );
});

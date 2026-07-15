import mongoose from "mongoose";
import { Class } from "../models/classes.model.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Role } from "../models/Roles.model.js";
import { Attendance } from "../models/attendance.model.js";
import { School } from "../models/school.model.js";
import { Payment } from "../models/payment.model.js";
import { Employee } from "../models/Employee.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { PayrollEntry } from "../models/payrollEntry.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { ExamClass } from "../models/ExamClass.model.js";
import { Task } from "../models/Task.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ObjectId = mongoose.Types.ObjectId;

const getMonthRange = (shift = 0) => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() + shift, 1),
    end: new Date(now.getFullYear(), now.getMonth() + shift + 1, 1),
  };
};

const safeGrowth = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const normalizeRoleName = (role = "") => String(role).trim().toLowerCase();

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

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
      StudentFee.aggregate([{ $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
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
      StudentFee.aggregate([
        { $match: { schoolId: schoolObjectId } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
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
  } else if (roleName === "Accountant") {
    // Accountant was already allowed through this route's role middleware but had no branch here,
    // so it silently fell into the generic "not available" case below — this closes that gap with
    // the same figures /dashboard/role-overview computes for the accountant role.
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new ApiError(400, "Valid schoolId is required for Accountant dashboard");
    }

    const schoolObjectId = new ObjectId(schoolId);
    const { startDate, endDate } = getCurrentMonthRange();

    const [monthCollection, pendingDues, successfulTransactions] = await Promise.all([
      Payment.aggregate([
        { $match: { schoolId: schoolObjectId, paymentDate: { $gte: startDate, $lt: endDate }, status: "success" } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
      StudentFee.aggregate([
        { $match: { schoolId: schoolObjectId } },
        { $group: { _id: null, totalPending: { $sum: "$dueAmount" } } },
      ]),
      Payment.countDocuments({ schoolId: schoolObjectId, status: "success" }),
    ]);

    response = {
      monthCollection: monthCollection[0]?.total || 0,
      pendingDues: pendingDues[0]?.totalPending || 0,
      successfulTransactions: successfulTransactions || 0,
    };
  } else {
    response = { message: "Dashboard not available for this role" };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, `${roleName} dashboard summary fetched successfully`));
});

export const getSchoolAdminDashboardAnalytics = asyncHandler(async (req, res) => {
  const schoolId = req.query.schoolId || req.user?.schoolId?._id || req.user?.schoolId;

  if (!schoolId || !ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Valid schoolId is required for School Admin analytics dashboard");
  }

  const schoolObjectId = new ObjectId(schoolId);
  const teacherRole = await Role.findOne({ name: { $regex: /^teacher$/i } }).select("_id");

  const { start: currentMonthStart, end: currentMonthEnd } = getMonthRange(0);
  const { start: prevMonthStart, end: prevMonthEnd } = getMonthRange(-1);

  const [
    totalStudents,
    newAdmissionsCurrent,
    newAdmissionsPrevious,
    totalTeachers,
    totalStaff,
    currentIncomeAgg,
    previousIncomeAgg,
    incomeModeBreakdown,
    salaryStats,
    salaryByUnit,
    employeePerformance,
  ] = await Promise.all([
    StudentEnrollment.countDocuments({ schoolId: schoolObjectId }),
    StudentEnrollment.countDocuments({
      schoolId: schoolObjectId,
      createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
    }),
    StudentEnrollment.countDocuments({
      schoolId: schoolObjectId,
      createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd },
    }),
    teacherRole?._id
      ? User.countDocuments({ schoolId: schoolObjectId, roleId: teacherRole._id })
      : 0,
    Employee.countDocuments({ schoolId: schoolObjectId, isActive: true }),
    Payment.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          paymentDate: { $gte: currentMonthStart, $lt: currentMonthEnd },
          status: "success",
        },
      },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          paymentDate: { $gte: prevMonthStart, $lt: prevMonthEnd },
          status: "success",
        },
      },
      { $group: { _id: "$paymentMode", value: { $sum: "$amountPaid" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          paymentDate: { $gte: currentMonthStart, $lt: currentMonthEnd },
          status: "success",
        },
      },
      { $group: { _id: "$paymentMode", value: { $sum: "$amountPaid" } } },
      { $sort: { value: -1 } },
    ]),
    PayrollEntry.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: { $ifNull: ["$employee.department", "General"] },
          value: { $sum: "$netPay" },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 5 },
    ]),
    PayrollEntry.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
            $lt: currentMonthEnd,
          },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            department: { $ifNull: ["$employee.department", "General"] },
          },
          value: { $sum: "$netPay" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]),
    PayrollEntry.aggregate([
      {
        $match: {
          schoolId: schoolObjectId,
          createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
     {
        $lookup: {
          from: "users",
          let: { userRef: "$employee.userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userRef"] },
                isActive: true,
                isDeleted: { $ne: true },
              },
            },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $addFields: {
          performanceScore: {
            $cond: [
              { $gt: ["$workingDays", 0] },
              { $multiply: [{ $divide: ["$presentDays", "$workingDays"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { performanceScore: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ["$user.name", "Employee"] },
          email: { $ifNull: ["$user.email", "-"] },
          designation: { $ifNull: ["$employee.designation", "Staff"] },
          dept: { $ifNull: ["$employee.department", "General"] },
          score: { $round: ["$performanceScore", 0] },
        },
      },
    ]),
  ]);

  const previousIncomeTotal = previousIncomeAgg.reduce((sum, item) => sum + (item.value || 0), 0);
  const currentIncome = currentIncomeAgg[0]?.total || 0;
  const activeStaff = Math.max(totalStaff, totalTeachers);

  const monthlyLabel = new Intl.DateTimeFormat("en-US", { month: "short" });
  const monthKeys = Array.from({ length: 12 }, (_, index) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthlyLabel.format(d),
    };
  });

  const topDepartments = salaryStats.slice(0, 2).map((item) => item._id);
  const fallbackDepartments = ["Teaching", "Administration"];
  const selectedDepartments =
    topDepartments.length === 2 ? topDepartments : [...topDepartments, ...fallbackDepartments].slice(0, 2);

  const salaryByMonthMap = monthKeys.map((month) => {
    const item = { month: month.label };
    selectedDepartments.forEach((dept) => {
      item[dept] = 0;
    });

    salaryByUnit
      .filter((row) => row._id.month === month.key && selectedDepartments.includes(row._id.department))
      .forEach((row) => {
        item[row._id.department] = Number((row.value || 0).toFixed(0));
      });

    return item;
  });

  const incomeAnalysisTotal = incomeModeBreakdown.reduce((sum, item) => sum + (item.value || 0), 0);
  const incomeAnalysis = (incomeModeBreakdown.length ? incomeModeBreakdown : [
    { _id: "cash", value: 0 },
    { _id: "online", value: 0 },
  ]).map((item, index) => {
    const palette = ["#1677ff", "#0891b2", "#0ea472", "#7c3aed"];
    return {
      label: String(item._id || "other").toUpperCase(),
      value: incomeAnalysisTotal ? Number(((item.value / incomeAnalysisTotal) * 100).toFixed(0)) : 0,
      color: palette[index % palette.length],
    };
  });

  const analytics = {
    summary: {
      newAdmissions: {
        value: newAdmissionsCurrent,
        growth: safeGrowth(newAdmissionsCurrent, newAdmissionsPrevious),
      },
      totalStudents: {
        value: totalStudents,
        growth: safeGrowth(totalStudents, Math.max(totalStudents - newAdmissionsCurrent, 0)),
      },
      totalTeachers: {
        value: totalTeachers,
        growth: 0,
      },
      totalIncome: {
        value: currentIncome,
        growth: safeGrowth(currentIncome, previousIncomeTotal),
      },
    },
    salaryStatistics: salaryStats.map((item, index) => ({
      title: item._id,
      value: Number((item.value || 0).toFixed(0)),
      color: ["#1677ff", "#7c3aed", "#0ea472", "#ea580c", "#0891b2"][index % 5],
    })),
    incomeAnalysis,
    salaryByUnit: {
      units: selectedDepartments.map((dept, index) => ({
        key: dept,
        color: index === 0 ? "#1677ff" : "#7c3aed",
        label: dept,
      })),
      chartData: salaryByMonthMap,
    },
    employeeStructure: [
      { label: "Students", count: totalStudents, color: "#1677ff" },
      { label: "Teachers", count: totalTeachers, color: "#7c3aed" },
      { label: "Staff", count: Math.max(activeStaff - totalTeachers, 0), color: "#0ea472" },
    ],
    employeePerformance: employeePerformance.map((employee) => {
      const score = Number(employee.score || 0);
      const performance =
        score >= 90 ? "EXCELLENT" : score >= 75 ? "GOOD" : score >= 60 ? "AVERAGE" : "POOR";
      return {
        ...employee,
        performance,
        avatar: null,
      };
    }),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, analytics, "School admin analytics fetched successfully"));
});

export const getRoleDashboardOverview = asyncHandler(async (req, res) => {
  const roleName = req.userRole?.name || req.query.role || "User";
  const normalizedRole = normalizeRoleName(roleName);
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  const userId = req.user?._id;
  const { startDate, endDate } = getCurrentMonthRange();

  const baseContext = {
    roleName,
    generatedAt: new Date().toISOString(),
  };

  if (normalizedRole === "student") {
    const student = await Student.findOne({ userId }).select("_id");
    if (!student) {
      return res
        .status(200)
        .json(new ApiResponse(200, { ...baseContext, metrics: [], lists: {} }, "Student profile not linked"));
    }

    const [attendance, fees, upcomingExams] = await Promise.all([
      Attendance.aggregate([
        { $match: { userId: userId, role: "student" } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
      ]),
      StudentFee.aggregate([
        { $match: { studentId: student._id } },
        {
          $group: {
            _id: null,
            totalPending: { $sum: "$dueAmount" },
          },
        },
      ]),
      ExamClass.aggregate([
        { $match: { schoolId: schoolId || null, examDate: { $gte: new Date() } } },
        { $sort: { examDate: 1 } },
        { $limit: 5 },
        { $project: { _id: 0, title: "$name", examDate: 1 } },
      ]),
    ]);

    const attendanceStat = attendance[0] || { total: 0, present: 0 };
    const attendancePercent = attendanceStat.total
      ? Math.round((attendanceStat.present / attendanceStat.total) * 100)
      : 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...baseContext,
          metrics: [
            { key: "attendance", label: "Attendance", value: attendancePercent, suffix: "%" },
            { key: "classes_attended", label: "Classes Marked", value: attendanceStat.total },
            { key: "pending_fees", label: "Pending Fees", value: fees[0]?.totalPending || 0, format: "currency" },
          ],
          lists: {
            upcomingExams: upcomingExams.map((exam) => ({
              title: exam.title || "Exam",
              date: exam.examDate,
            })),
          },
        },
        "Student dashboard overview fetched successfully"
      )
    );
  }

  if (normalizedRole === "parent") {
    const linkedStudents = await Student.find({
      $or: [{ fatherId: userId }, { motherId: userId }, { guardianId: userId }],
    }).select("_id userId");

    const linkedStudentIds = linkedStudents.map((student) => student._id);
    const linkedUserIds = linkedStudents.map((student) => student.userId).filter(Boolean);

    const [attendance, feeSummary] = await Promise.all([
      Attendance.aggregate([
        {
          $match: {
            userId: { $in: linkedUserIds },
            role: "student",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
      ]),
      StudentFee.aggregate([
        { $match: { studentId: { $in: linkedStudentIds } } },
        {
          $group: {
            _id: null,
            totalPending: { $sum: "$dueAmount" },
          },
        },
      ]),
    ]);

    const attendanceStat = attendance[0] || { total: 0, present: 0 };
    const attendancePercent = attendanceStat.total
      ? Math.round((attendanceStat.present / attendanceStat.total) * 100)
      : 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...baseContext,
          metrics: [
            { key: "children", label: "Children", value: linkedStudents.length },
            { key: "attendance", label: "Average Attendance", value: attendancePercent, suffix: "%" },
            {
              key: "pending_fees",
              label: "Pending Fees",
              value: feeSummary[0]?.totalPending || 0,
              format: "currency",
            },
          ],
          lists: {},
        },
        "Parent dashboard overview fetched successfully"
      )
    );
  }

  if (normalizedRole === "accountant") {
    const schoolFilter = schoolId ? { schoolId } : {};
    const [thisMonthPayments, totalPendingFees, successfulPayments] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            ...schoolFilter,
            paymentDate: { $gte: startDate, $lt: endDate },
            status: "success",
          },
        },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
      StudentFee.aggregate([
        { $match: schoolFilter },
        { $group: { _id: null, totalPending: { $sum: "$dueAmount" } } },
      ]),
      Payment.countDocuments({ ...schoolFilter, status: "success" }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...baseContext,
          metrics: [
            {
              key: "month_collection",
              label: "This Month Collection",
              value: thisMonthPayments[0]?.total || 0,
              format: "currency",
            },
            {
              key: "pending_dues",
              label: "Pending Dues",
              value: totalPendingFees[0]?.totalPending || 0,
              format: "currency",
            },
            { key: "successful_transactions", label: "Successful Transactions", value: successfulPayments || 0 },
          ],
          lists: {},
        },
        "Accountant dashboard overview fetched successfully"
      )
    );
  }

  if (normalizedRole === "staff") {
    const [attendance, taskCounts] = await Promise.all([
      Attendance.aggregate([
        {
          $match: {
            userId,
            role: "staff",
            date: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          },
        },
      ]),
      Task.aggregate([
        { $match: { assignedTo: userId, ...(schoolId ? { schoolId } : {}) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const attendanceStat = attendance[0] || { total: 0, present: 0 };
    const attendancePercent = attendanceStat.total
      ? Math.round((attendanceStat.present / attendanceStat.total) * 100)
      : 0;

    const countByStatus = Object.fromEntries(taskCounts.map((t) => [t._id, t.count]));
    const pendingTasks = (countByStatus.todo || 0) + (countByStatus.in_progress || 0);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...baseContext,
          metrics: [
            { key: "attendance", label: "My Attendance (Month)", value: attendancePercent, suffix: "%" },
            { key: "pending_tasks", label: "Pending Tasks", value: pendingTasks },
            { key: "completed_tasks", label: "Completed Tasks", value: countByStatus.done || 0 },
          ],
          lists: {},
        },
        "Staff dashboard overview fetched successfully"
      )
    );
  }

  const schoolFilter = schoolId ? { schoolId } : {};
  const [presentDays, activeEmployees, latestAdmissions] = await Promise.all([
    Attendance.countDocuments({
      ...schoolFilter,
      userId,
      role: { $in: ["staff", "teacher"] },
      status: "present",
      date: { $gte: startDate, $lt: endDate },
    }),
    Employee.countDocuments({ ...schoolFilter, isActive: true }),
    StudentEnrollment.countDocuments({
      ...schoolFilter,
      createdAt: { $gte: startDate, $lt: endDate },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...baseContext,
        metrics: [
          { key: "present_days", label: "Present Days (Month)", value: presentDays || 0 },
          { key: "active_staff", label: "Active Staff", value: activeEmployees || 0 },
          { key: "new_admissions", label: "New Admissions", value: latestAdmissions || 0 },
        ],
        lists: {},
      },
      `${roleName} dashboard overview fetched successfully`
    )
  );
});

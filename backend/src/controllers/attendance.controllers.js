import mongoose from "mongoose";
import { Attendance } from "../models/attendance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const SUPER_ADMIN = "Super Admin";
const SCHOOL_ADMIN = "School Admin";
const TEACHER = "Teacher";
const STAFF = "Staff";
const SUPPORT_STAFF = "Support Staff";
const STUDENT = "Student";
const PARENT = "Parent";
const ACCOUNTANT = "Accountant";
const ADMIN = "Admin";
const PRINCIPAL = "Principal";
const VICE_PRINCIPAL = "Vice Principal";
const SUBJECT_COORDINATOR = "Subject Coordinator";
const LIBRARIAN = "Librarian";
const HOSTEL_WARDEN = "Hostel Warden";
const TRANSPORT_MANAGER = "Transport Manager";
const EXAM_COORDINATOR = "Exam Coordinator";
const RECEPTIONIST = "Receptionist";
const IT_SUPPORT = "IT Support";
const COUNSELOR = "Counselor";
const SECURITY = "Security";

const ROLE_TO_ATTENDANCE_ROLE = {
  [SUPER_ADMIN]: "super_admin",
  [SCHOOL_ADMIN]: "school_admin",
  [ADMIN]: "admin",
  [PRINCIPAL]: "principal",
  [VICE_PRINCIPAL]: "vice_principal",
  [TEACHER]: "teacher",
  [SUBJECT_COORDINATOR]: "subject_coordinator",
  [STUDENT]: "student",
  [PARENT]: "parent",
  [ACCOUNTANT]: "accountant",
  [STAFF]: "staff",
  [SUPPORT_STAFF]: "support_staff",
  [LIBRARIAN]: "librarian",
  [HOSTEL_WARDEN]: "hostel_warden",
  [TRANSPORT_MANAGER]: "transport_manager",
  [EXAM_COORDINATOR]: "exam_coordinator",
  [RECEPTIONIST]: "receptionist",
  [IT_SUPPORT]: "it_support",
  [COUNSELOR]: "counselor",
  [SECURITY]: "security",
};

const ADMIN_ATTENDANCE_ROLES = [SUPER_ADMIN, SCHOOL_ADMIN, ADMIN, PRINCIPAL, VICE_PRINCIPAL];
const STUDENT_ATTENDANCE_MARKERS = [...ADMIN_ATTENDANCE_ROLES, TEACHER, HOSTEL_WARDEN];
const STAFF_ATTENDANCE_MARKERS = [...ADMIN_ATTENDANCE_ROLES, ACCOUNTANT];
const SELF_ATTENDANCE_ROLES = [
  TEACHER,
  STAFF,
  SUPPORT_STAFF,
  SUBJECT_COORDINATOR,
  LIBRARIAN,
  HOSTEL_WARDEN,
  TRANSPORT_MANAGER,
  EXAM_COORDINATOR,
  RECEPTIONIST,
  IT_SUPPORT,
  COUNSELOR,
  SECURITY,
  ACCOUNTANT,
];
const ALL_ATTENDANCE_ROLES = [
  SUPER_ADMIN,
  SCHOOL_ADMIN,
  ADMIN,
  PRINCIPAL,
  VICE_PRINCIPAL,
  TEACHER,
  SUBJECT_COORDINATOR,
  STUDENT,
  PARENT,
  ACCOUNTANT,
  STAFF,
  SUPPORT_STAFF,
  LIBRARIAN,
  HOSTEL_WARDEN,
  TRANSPORT_MANAGER,
  EXAM_COORDINATOR,
  RECEPTIONIST,
  IT_SUPPORT,
  COUNSELOR,
  SECURITY,
];

const getAttendanceRoleForUser = (roleName) => ROLE_TO_ATTENDANCE_ROLE[roleName] || "staff";

const isSelfAttendancePayload = (req, role, records = []) => {
  const myAttendanceRole = getAttendanceRoleForUser(req.userRole?.name);
  const myUserId = req.user?._id?.toString();
  return Boolean(myUserId) && role === myAttendanceRole && records.every((record) => record.userId?.toString() === myUserId);
};

const applyReadScope = (req, filter) => {
  const userRole = req.userRole?.name;
  if (ADMIN_ATTENDANCE_ROLES.includes(userRole) || [ACCOUNTANT, HOSTEL_WARDEN].includes(userRole)) return;

  if (userRole === TEACHER) {
    filter.$or = [{ markedBy: req.user._id }, { userId: req.user._id }];
    return;
  }

  if (SELF_ATTENDANCE_ROLES.includes(userRole) || userRole === STUDENT) {
    filter.userId = req.user._id;
  }
};

const normalizeDateStart = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const normalizeDateEnd = (value) => {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const ensureSchoolAccess = (req, requestedSchoolId) => {
  const userRole = req.userRole?.name;
  const mySchoolId = req.user?.schoolId?.toString();

  if (userRole === SUPER_ADMIN) {
    if (!requestedSchoolId) {
      throw new ApiError(400, "schoolId is required for Super Admin requests");
    }
    return requestedSchoolId;
  }

  if (!mySchoolId) {
    throw new ApiError(403, "User is not mapped to a school");
  }

  if (requestedSchoolId && requestedSchoolId !== mySchoolId) {
    throw new ApiError(403, "You can only access attendance in your own school");
  }

  return mySchoolId;
};

const assertTeacherScope = (req, payload = {}) => {
  const userRole = req.userRole?.name;
  if (userRole !== TEACHER) return;

  const teacherId = req.user?._id?.toString();
  if (!teacherId) throw new ApiError(403, "Invalid teacher identity");

  if (payload.markedBy && payload.markedBy.toString() !== teacherId) {
    throw new ApiError(403, "Teachers can only manage attendance marked by themselves");
  }
};

export const markBulkAttendance = asyncHandler(async (req, res) => {
  const { schoolId, date, role, schoolClassId, sectionId, subjectId, remarks, records } = req.body;

  const userRole = req.userRole?.name;
  const canSelfMark = SELF_ATTENDANCE_ROLES.includes(userRole) && isSelfAttendancePayload(req, role, records);
  const canMarkStudents = STUDENT_ATTENDANCE_MARKERS.includes(userRole) && role === "student";
  const canMarkStaffLike = STAFF_ATTENDANCE_MARKERS.includes(userRole) && role !== "student";

  if (!canSelfMark && !canMarkStudents && !canMarkStaffLike) {
    throw new ApiError(403, "You are not allowed to mark attendance for this role");
  }

  const resolvedSchoolId = ensureSchoolAccess(req, schoolId);
  const normalizedDate = normalizeDateStart(date);

  const docs = records.map((record) => {
    const doc = {
      schoolId: resolvedSchoolId,
      userId: record.userId,
      role,
      schoolClassId: schoolClassId || null,
      sectionId: sectionId || null,
      subjectId: subjectId || null,
      date: normalizedDate,
      status: record.status,
      markedBy: req.user._id,
      remarks: record.remarks ?? remarks ?? "",
    };
    // Only include checkInAt / checkOutAt when explicitly provided — never overwrite
    // a teacher's GPS self-check-in data with null when admin bulk-marks attendance.
    if (record.checkInAt != null) doc.checkInAt = record.checkInAt;
    if (record.checkOutAt != null) doc.checkOutAt = record.checkOutAt;
    return doc;
  });

  if (SELF_ATTENDANCE_ROLES.includes(userRole) && !ADMIN_ATTENDANCE_ROLES.includes(userRole) && !canMarkStudents) {
    docs.forEach((doc) => {
      if (doc.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can mark only your own attendance");
      }
    });
  }
  try {
    const result = await Attendance.bulkWrite(
      docs.map((doc) => {
        // Core fields that admin always sets
        const setFields = {
          role: doc.role,
          status: doc.status,
          markedBy: doc.markedBy,
          remarks: doc.remarks,
          schoolClassId: doc.schoolClassId,
          sectionId: doc.sectionId,
          subjectId: doc.subjectId,
        };
        // Only update check-in/out times if admin explicitly supplied them
        if (doc.checkInAt != null) setFields.checkInAt = doc.checkInAt;
        if (doc.checkOutAt != null) setFields.checkOutAt = doc.checkOutAt;

        return {
          updateOne: {
            filter: { schoolId: doc.schoolId, userId: doc.userId, date: doc.date },
            update: {
              $set: setFields,
              // On insert only — set the identity fields that cannot change
              $setOnInsert: {
                schoolId: doc.schoolId,
                userId: doc.userId,
                date: doc.date,
              },
            },
            upsert: true,
          },
        };
      })
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Bulk attendance marked successfully"));
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "Duplicate attendance detected for the same user and date");
    }
    throw error;
  }
});

export const getAttendance = asyncHandler(async (req, res) => {
  const { schoolId, schoolClassId, sectionId, subjectId, date, role, userId, search, page, limit } = req.query;

  const filter = {
    schoolId: ensureSchoolAccess(req, schoolId),
  };

  if (schoolClassId) filter.schoolClassId = schoolClassId;
  if (sectionId) filter.sectionId = sectionId;
  if (subjectId) filter.subjectId = subjectId;
  if (role) filter.role = role;
  if (userId) filter.userId = userId;
  if (date) {
    filter.date = {
      $gte: normalizeDateStart(date),
      $lte: normalizeDateEnd(date),
    };
  }

  applyReadScope(req, filter);

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 200);
  const skip = (pageNum - 1) * limitNum;

  const query = Attendance.find(filter)
    .populate("userId", "name email")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name")
    .populate("markedBy", "name")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  if (search) {
    query.where({ remarks: { $regex: search, $options: "i" } });
  }

  const [items, total] = await Promise.all([query, Attendance.countDocuments(filter)]);

  const data = {
    items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };

  return res.status(200).json(new ApiResponse(200, data, "Attendance fetched successfully"));
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { schoolId, month, year, schoolClassId, sectionId, role } = req.query;
  const resolvedSchoolId = ensureSchoolAccess(req, schoolId);

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const match = {
    schoolId: new mongoose.Types.ObjectId(resolvedSchoolId),
    date: { $gte: start, $lte: end },
  };
  if (schoolClassId) match.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
  if (sectionId) match.sectionId = new mongoose.Types.ObjectId(sectionId);
  if (role) match.role = role;
  if (req.userRole?.name === TEACHER) {
    match.$or = [{ markedBy: req.user._id }, { userId: req.user._id }];
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          userId: "$userId",
          date: "$date",
        },
        status: { $last: "$status" },
      },
    },
    {
      $group: {
        _id: {
          userId: "$_id.userId",
          status: "$status",
        },
        count: { $sum: 1 },
        dailyEntries: {
          $push: {
            day: { $dayOfMonth: "$_id.date" },
            status: "$status",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        totalDays: { $sum: "$count" },
        statuses: {
          $push: {
            k: "$_id.status",
            v: "$count",
          },
        },
        dailyEntriesByStatus: { $push: "$dailyEntries" },
      },
    },
    {
      $project: {
        totalDays: 1,
        statusBreakdown: { $arrayToObject: "$statuses" },
        dailyStatusEntries: {
          $reduce: {
            input: "$dailyEntriesByStatus",
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
        presentDays: { $ifNull: [{ $getField: { field: "present", input: { $arrayToObject: "$statuses" } } }, 0] },
        attendancePercentage: {
          $cond: [
            { $gt: ["$totalDays", 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: [{ $ifNull: [{ $getField: { field: "present", input: { $arrayToObject: "$statuses" } } }, 0] }, "$totalDays"] },
                    100,
                  ],
                },
                2,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $lookup: {
        from: "users",
       let: { userRef: "$_id" },
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
      $project: {
        userId: "$_id",
        name: "$user.name",
        email: "$user.email",
        totalDays: 1,
        presentDays: 1,
        attendancePercentage: 1,
        statusBreakdown: 1,
        dailyStatus: {
          $arrayToObject: {
            $map: {
              input: "$dailyStatusEntries",
              as: "entry",
              in: {
                k: { $toString: "$$entry.day" },
                v: "$$entry.status",
              },
            },
          },
        },
      },
    },
    { $sort: { attendancePercentage: -1 } },
  ];


  const report = await Attendance.aggregate(pipeline);

  return res.status(200).json(new ApiResponse(200, report, "Monthly report generated"));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new ApiError(404, "Attendance record not found");

  const resolvedSchoolId = ensureSchoolAccess(req, attendance.schoolId.toString());
  if (attendance.schoolId.toString() !== resolvedSchoolId.toString()) {
    throw new ApiError(403, "Not allowed to edit this attendance record");
  }

  assertTeacherScope(req, { markedBy: attendance.markedBy });

  const updated = await Attendance.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  return res.status(200).json(new ApiResponse(200, updated, "Attendance updated"));
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new ApiError(404, "Attendance record not found");

  const resolvedSchoolId = ensureSchoolAccess(req, attendance.schoolId.toString());
  if (attendance.schoolId.toString() !== resolvedSchoolId.toString()) {
    throw new ApiError(403, "Not allowed to delete this attendance record");
  }

  assertTeacherScope(req, { markedBy: attendance.markedBy });

  await attendance.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Attendance deleted"));
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const { month, year, childId, schoolId } = req.query;

  let targetUserId = req.user._id;
  if (req.userRole?.name === PARENT) {
    if (!childId) {
      throw new ApiError(400, "childId is required for parent attendance view");
    }
    // Verify this child actually belongs to the requesting parent
    const { Student } = await import("../models/student.model.js");
    const child = await Student.findOne({
      userId: childId,
      $or: [
        { fatherId: req.user._id },
        { motherId: req.user._id },
        { guardianId: req.user._id },
      ],
    }).select("_id");
    if (!child) {
      throw new ApiError(403, "You are not authorized to view this child's attendance");
    }
    targetUserId = childId;
  }

  if (!ALL_ATTENDANCE_ROLES.includes(req.userRole?.name)) {
    throw new ApiError(403, "Not allowed to access this endpoint");
  }

  const filter = {
    schoolId: ensureSchoolAccess(req, schoolId || req.user?.schoolId?.toString()),
    userId: targetUserId,
  };

  if (month && year) {
    filter.date = {
      $gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
      $lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }

  const data = await Attendance.find(filter).sort({ date: -1 });

  return res.status(200).json(new ApiResponse(200, data, "My attendance fetched"));
});

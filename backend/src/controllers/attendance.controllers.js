import mongoose from "mongoose";
import { Attendance } from "../models/attendance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const SUPER_ADMIN = "Super Admin";
const SCHOOL_ADMIN = "School Admin";
const TEACHER = "Teacher";
const STAFF = "Staff";
const STUDENT = "Student";
const PARENT = "Parent";

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
  const { schoolId, date, role, classId, sectionId, subjectId, remarks, records } = req.body;

  const allowedRoles = [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STAFF];
  if (!allowedRoles.includes(req.userRole?.name)) {
    throw new ApiError(403, "You are not allowed to mark attendance");
  }

  if (req.userRole?.name === STAFF && role !== "staff") {
    throw new ApiError(403, "Staff can only mark self attendance");
  }

  if (req.userRole?.name === TEACHER && role !== "student") {
    throw new ApiError(403, "Teacher can only mark student attendance");
  }

  const resolvedSchoolId = ensureSchoolAccess(req, schoolId);
  const normalizedDate = normalizeDateStart(date);

  const docs = records.map((record) => ({
    schoolId: resolvedSchoolId,
    userId: record.userId,
    role,
    classId: classId || null,
    sectionId: sectionId || null,
    subjectId: subjectId || null,
    date: normalizedDate,
    status: record.status,
    markedBy: req.user._id,
    remarks: record.remarks ?? remarks ?? "",
    checkInAt: record.checkInAt || null,
    checkOutAt: record.checkOutAt || null,
  }));

  if (req.userRole?.name === STAFF) {
    docs.forEach((doc) => {
      if (doc.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Staff can mark only their own attendance");
      }
    });
  }

  try {
    const result = await Attendance.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { schoolId: doc.schoolId, userId: doc.userId, date: doc.date },
          update: { $set: doc },
          upsert: true,
        },
      }))
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
  const { schoolId, classId, sectionId, subjectId, date, role, userId, search, page, limit } = req.query;

  const filter = {
    schoolId: ensureSchoolAccess(req, schoolId),
  };

  if (classId) filter.classId = classId;
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

  assertTeacherScope(req, filter);

  const skip = (page - 1) * limit;

  const query = Attendance.find(filter)
    .populate("userId", "name email")
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name")
    .populate("markedBy", "name")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (search) {
    query.where({ remarks: { $regex: search, $options: "i" } });
  }

  const [items, total] = await Promise.all([query, Attendance.countDocuments(filter)]);

  const data = {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  return res.status(200).json(new ApiResponse(200, data, "Attendance fetched successfully"));
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { schoolId, month, year, classId, sectionId, role } = req.query;
  const resolvedSchoolId = ensureSchoolAccess(req, schoolId);

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const match = {
    schoolId: new mongoose.Types.ObjectId(resolvedSchoolId),
    date: { $gte: start, $lte: end },
  };
  if (classId) match.classId = new mongoose.Types.ObjectId(classId);
  if (sectionId) match.sectionId = new mongoose.Types.ObjectId(sectionId);
  if (role) match.role = role;

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          userId: "$userId",
          status: "$status",
        },
        count: { $sum: 1 },
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
      },
    },
    {
      $project: {
        totalDays: 1,
        statusBreakdown: { $arrayToObject: "$statuses" },
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
        localField: "_id",
        foreignField: "_id",
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
  const { month, year, childId } = req.query;

  let targetUserId = req.user._id;
  if (req.userRole?.name === PARENT) {
    if (!childId) {
      throw new ApiError(400, "childId is required for parent attendance view");
    }
    targetUserId = childId;
  }

  if (![STUDENT, TEACHER, STAFF, PARENT].includes(req.userRole?.name)) {
    throw new ApiError(403, "Not allowed to access this endpoint");
  }

  const filter = {
    schoolId: ensureSchoolAccess(req, req.user?.schoolId?.toString()),
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

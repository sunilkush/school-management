import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
// Registers the "Student"/"FeeStructure" models this file's .populate() calls resolve by name —
// not otherwise imported here, so relying on some other module happening to load them first.
import "../models/student.model.js";
import "../models/feeStructure.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/**
 * Fee collected per calendar day within [from, to] (inclusive), scoped to one school.
 */
const dailyCollection = async ({ schoolId, from, to }) => {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const rows = await Payment.aggregate([
    {
      $match: {
        schoolId: toObjectId(schoolId),
        status: "success",
        paymentDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
        // Nets out refunds so a fully- or partially-refunded payment doesn't overstate collections.
        totalCollected: { $sum: { $subtract: ["$amountPaid", { $ifNull: ["$refundedAmount", 0] }] } },
        paymentCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    from,
    to,
    days: rows.map((r) => ({ date: r._id, totalCollected: r.totalCollected, paymentCount: r.paymentCount })),
    totalCollected: rows.reduce((sum, r) => sum + r.totalCollected, 0),
  };
};

/**
 * Fee collected per month of a given calendar year, scoped to one school.
 */
const monthWiseCollection = async ({ schoolId, year }) => {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) throw new Error("Invalid year");

  const start = new Date(numericYear, 0, 1);
  const end = new Date(numericYear + 1, 0, 1);

  const rows = await Payment.aggregate([
    {
      $match: {
        schoolId: toObjectId(schoolId),
        status: "success",
        paymentDate: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $month: "$paymentDate" },
        // Nets out refunds so a fully- or partially-refunded payment doesn't overstate collections.
        totalCollected: { $sum: { $subtract: ["$amountPaid", { $ifNull: ["$refundedAmount", 0] }] } },
        paymentCount: { $sum: 1 },
      },
    },
  ]);

  const byMonth = new Map(rows.map((r) => [r._id, r]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const row = byMonth.get(month);
    return { month, totalCollected: row?.totalCollected || 0, paymentCount: row?.paymentCount || 0 };
  });

  return {
    year: numericYear,
    months,
    totalCollected: months.reduce((sum, m) => sum + m.totalCollected, 0),
  };
};

/**
 * Fee collected per student within one class, scoped to one school. Class membership lives on
 * StudentEnrollment (Student/StudentFee/Payment carry no direct class reference), so this
 * resolves the roster first, then aggregates payments against it.
 */
const classWiseCollection = async ({ schoolId, schoolClassId, academicYearId }) => {
  if (!schoolClassId || !mongoose.Types.ObjectId.isValid(schoolClassId)) {
    throw new Error("Invalid schoolClassId");
  }

  const enrollmentFilter = {
    schoolId: toObjectId(schoolId),
    schoolClassId: toObjectId(schoolClassId),
    status: "Active",
  };
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    enrollmentFilter.academicYearId = toObjectId(academicYearId);
  }
  const studentIds = await StudentEnrollment.distinct("studentId", enrollmentFilter);

  const rows = await Payment.aggregate([
    {
      $match: {
        schoolId: toObjectId(schoolId),
        status: "success",
        studentId: { $in: studentIds },
      },
    },
    {
      $group: {
        _id: "$studentId",
        // Nets out refunds so a fully- or partially-refunded payment doesn't overstate collections.
        totalCollected: { $sum: { $subtract: ["$amountPaid", { $ifNull: ["$refundedAmount", 0] }] } },
        paymentCount: { $sum: 1 },
      },
    },
    { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        studentId: "$_id",
        studentName: "$student.name",
        totalCollected: 1,
        paymentCount: 1,
      },
    },
    { $sort: { studentName: 1 } },
  ]);

  return {
    schoolClassId,
    totalStudentsInClass: studentIds.length,
    students: rows,
    totalCollected: rows.reduce((sum, r) => sum + r.totalCollected, 0),
  };
};

/**
 * Outstanding (dueAmount > 0) fee records, optionally narrowed to one class, scoped to one school.
 */
const pendingFeeReport = async ({ schoolId, schoolClassId, academicYearId }) => {
  const filter = { schoolId: toObjectId(schoolId), dueAmount: { $gt: 0 } };

  if (schoolClassId) {
    if (!mongoose.Types.ObjectId.isValid(schoolClassId)) throw new Error("Invalid schoolClassId");
    const enrollmentFilter = {
      schoolId: toObjectId(schoolId),
      schoolClassId: toObjectId(schoolClassId),
      status: "Active",
    };
    if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
      enrollmentFilter.academicYearId = toObjectId(academicYearId);
    }
    filter.studentId = { $in: await StudentEnrollment.distinct("studentId", enrollmentFilter) };
  }

  const records = await StudentFee.find(filter)
    .populate("studentId", "name admissionNo")
    .populate("feeStructureId", "amount feeHeadId")
    .sort({ dueAmount: -1 })
    .lean();

  return {
    schoolClassId: schoolClassId || null,
    count: records.length,
    totalPending: records.reduce((sum, r) => sum + (r.dueAmount || 0), 0),
    records,
  };
};

/**
 * Main report switch
 */
export const generateFeeReport = async (filters) => {
  const { type } = filters;

  switch (type) {
    case "daily":
      return dailyCollection(filters);

    case "monthly":
      return monthWiseCollection(filters);

    case "class":
      return classWiseCollection(filters);

    case "pending":
      return pendingFeeReport(filters);

    default:
      throw new Error("Invalid report type");
  }
};

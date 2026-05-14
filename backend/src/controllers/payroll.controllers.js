import mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Employee } from "../models/Employee.model.js";
import { PayrollCycle } from "../models/payrollCycle.model.js";
import { PayrollEntry } from "../models/payrollEntry.model.js";
import { PayrollPolicy } from "../models/payrollPolicy.model.js";
import { PayrollStructure } from "../models/payrollStructure.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { calculatePayrollEntry } from "../services/payrollCalculator.service.js";

const getSchoolId = (req) => {
  const requestedSchoolId = req.body?.schoolId || req.query?.schoolId;
  const userSchoolId = req.user?.schoolId;

  if (req.userRole?.name === "Super Admin" && requestedSchoolId) return requestedSchoolId;
  return userSchoolId || requestedSchoolId;
};

const assertSchoolId = (schoolId) => {
  if (!schoolId) throw new ApiError(400, "School context is required for payroll");
};

const monthRangeUTC = ({ month, year }) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
};

const getAttendanceSummary = async ({ schoolId, employeeUserId, month, year }) => {
  const { start, end } = monthRangeUTC({ month, year });

  const records = await Attendance.find({
    schoolId,
    userId: employeeUserId,
    role: { $in: ["teacher", "staff"] },
    date: { $gte: start, $lte: end },
  })
    .select("status")
    .lean();

  const statusCount = records.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { present: 0, leave: 0, halfday: 0, absent: 0, late: 0 }
  );

  const workingDays = records.length;
  const presentDays = statusCount.present + statusCount.late + statusCount.halfday * 0.5;
  const leaveDays = statusCount.leave;

  return {
    workingDays,
    presentDays,
    leaveDays,
    isMissingAttendance: workingDays === 0,
  };
};

const writeAuditLog = async (req, action, description, meta = {}) => {
  if (!req.user?._id) return;
  await ActivityLog.create({
    user: req.user._id,
    action,
    description,
    role: req.user.roleId,
    school: req.user.schoolId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    meta,
  });
};
const ensureEmployeeBelongsToSchool = async ({ employeeId, schoolId }) => {
  const employee = await Employee.findOne({ _id: employeeId, schoolId }).select("_id").lean();
  if (!employee) throw new ApiError(404, "Employee not found for this school");
  return employee;
};

const hasOverlappingActiveStructure = async ({ schoolId, employeeId, effectiveFrom, effectiveTo, excludeId }) => {
  const from = new Date(effectiveFrom);
  const to = effectiveTo ? new Date(effectiveTo) : new Date("2099-12-31T23:59:59.999Z");
  const overlapFilter = {
    schoolId,
    employeeId,
    status: "active",
    effectiveFrom: { $lte: to },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: from } }],
  };

  if (excludeId) overlapFilter._id = { $ne: excludeId };
  return Boolean(await PayrollStructure.exists(overlapFilter));
};
export const createPayrollStructure = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  await ensureEmployeeBelongsToSchool({ employeeId: req.body.employeeId, schoolId });

  if (req.body.status !== "inactive") {
    const hasOverlap = await hasOverlappingActiveStructure({
      schoolId,
      employeeId: req.body.employeeId,
      effectiveFrom: req.body.effectiveFrom,
      effectiveTo: req.body.effectiveTo,
    });
    if (hasOverlap) throw new ApiError(409, "Active salary structure overlaps with an existing structure for this employee");
  }

  const payload = {
    ...req.body,
    schoolId,
  };

  const structure = await PayrollStructure.create(payload);
  await writeAuditLog(req, "PAYROLL_STRUCTURE_CREATED", "Payroll salary structure created", {
    payrollStructureId: structure._id,
    employeeId: structure.employeeId,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Payroll structure created",
    data: structure,
  });
});
export const getPayrollStructures = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
   assertSchoolId(schoolId);
  const structures = await PayrollStructure.find({ schoolId })
    .populate({ path: "employeeId", select: "department designation userId", populate: { path: "userId", select: "name email" } })
    .sort({ effectiveFrom: -1, createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Payroll structures fetched",
    data: structures,
  });
});
export const updatePayrollStructure = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const existingStructure = await PayrollStructure.findOne({ _id: req.params.id, schoolId });
  if (!existingStructure) throw new ApiError(404, "Payroll structure not found");

  const nextStructure = { ...existingStructure.toObject(), ...req.body };
  if (nextStructure.status === "active") {
    const hasOverlap = await hasOverlappingActiveStructure({
      schoolId,
      employeeId: existingStructure.employeeId,
      effectiveFrom: nextStructure.effectiveFrom,
      effectiveTo: nextStructure.effectiveTo,
      excludeId: existingStructure._id,
    });
    if (hasOverlap) throw new ApiError(409, "Active salary structure overlaps with an existing structure for this employee");
  }

  const structure = await PayrollStructure.findOneAndUpdate(
    { _id: req.params.id, schoolId },
    { $set: req.body },
    { new: true }
  );

  

  await writeAuditLog(req, "PAYROLL_STRUCTURE_UPDATED", "Payroll salary structure updated", {
    payrollStructureId: structure._id,
  });

  return sendSuccess(res, { message: "Payroll structure updated", data: structure });
});

export const generatePayrollCycle = asyncHandler(async (req, res) => {
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  const schoolId = getSchoolId(req);
  console.log(month,year,schoolId)
  assertSchoolId(schoolId);

  if (!month || month < 1 || month > 12) {
    throw new ApiError(400, "Invalid month");
  }

  if (!year || year < 2000) {
    throw new ApiError(400, "Invalid year");
  }

  let cycle = await PayrollCycle.findOne({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    month,
    year,
  });

  console.log("Payroll cycle found:", cycle);

  if (cycle && cycle.status !== "draft") {
    throw new ApiError(
      409,
      `Payroll cycle already ${cycle.status}. Locked or paid payroll cycle cannot be regenerated`
    );
  }

  const employees = await Employee.find({
    schoolId,
    isActive: true,
  }).select("_id userId").lean();
  console.log("employees",employees)
  if (!employees.length) {
    throw new ApiError(400, "No active employees found for this school");
  }

  const policy = await PayrollPolicy.findOneAndUpdate(
    { schoolId },
    { $setOnInsert: { schoolId } },
    { upsert: true, new: true }
  );
  console.log("policy",policy)
  const createdNewCycle = !cycle;

  if (!cycle) {
    cycle = await PayrollCycle.create({
      schoolId,
      month,
      year,
      status: "draft",
      processedBy: req.user._id,
    });
  }

  const entries = [];

  const cycleStart = new Date(Date.UTC(year, month - 1, 1));
  const cycleEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

 for (const employee of employees) {
  const structure = await PayrollStructure.findOne({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    employeeId: employee._id,
    status: "active",
    effectiveFrom: { $lte: cycleEnd },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $exists: false } },
      { effectiveTo: { $gte: cycleStart } },
    ],
  })
    .sort({ effectiveFrom: -1 })
    .lean();

  console.log("employee:", employee._id);
  console.log("structure:", structure);

  if (!structure) continue;

  const attendance = await getAttendanceSummary({
    schoolId,
    employeeUserId: employee.userId,
    month,
    year,
  });

  const calculated = calculatePayrollEntry({
    structure,
    attendance,
    policy,
  });

  const warnings = [];

  if (attendance.isMissingAttendance) {
    warnings.push("Attendance missing for selected cycle");
  }

  if (calculated.netPay < 0) {
    warnings.push("Net pay is negative. Review deductions/policy.");
  }

  entries.push({
    payrollCycleId: cycle._id,
    schoolId,
    employeeId: employee._id,

    ...calculated.attendance,

    earningsBreakdown: calculated.earningsBreakdown,
    deductionsBreakdown: calculated.deductionsBreakdown,
    grossEarnings: calculated.grossEarnings,
    totalDeductions: calculated.totalDeductions,
    netPay: calculated.netPay,
    warnings,
  });
}

  if (!entries.length) {
    if (createdNewCycle) {
      await PayrollCycle.deleteOne({ _id: cycle._id });
    }

    throw new ApiError(
      400,
      "No active salary structures found for payroll generation"
    );
  }

  await PayrollEntry.deleteMany({ payrollCycleId: cycle._id });
  await PayrollEntry.insertMany(entries, { ordered: false });

  cycle.processedBy = req.user._id;
  await cycle.save();

  await writeAuditLog(
    req,
    createdNewCycle
      ? "PAYROLL_CYCLE_GENERATED"
      : "PAYROLL_CYCLE_REGENERATED",
    "Payroll cycle generated",
    {
      payrollCycleId: cycle._id,
      month,
      year,
      generatedEntries: entries.length,
    }
  );

  return sendSuccess(res, {
    statusCode: createdNewCycle ? 201 : 200,
    message: createdNewCycle
      ? "Payroll cycle generated"
      : "Draft payroll cycle refreshed",
    data: {
      payrollCycle: cycle, // ✅ frontend ke liye clear name
      cycle,              // ✅ backward compatibility
      entriesCount: entries.length,
    },
  });
});

export const getPayrollCycle = asyncHandler(async (req, res) => {
  const { month, year } = req.params;
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) }).lean();
  
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const entries = await PayrollEntry.find({ payrollCycleId: cycle._id })
   .populate({
      path: "employeeId",
      select: "department designation employeeCode phoneNo bankDetails.bankName bankDetails.accountNumber userId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Payroll cycle fetched",
    data: { cycle, entries },
  });
});

export const lockPayrollCycle = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
   assertSchoolId(schoolId);
  const cycle = await PayrollCycle.findOne({ _id: req.params.id, schoolId });
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");
  if (cycle.status === "paid") throw new ApiError(400, "Paid cycle cannot be modified");

  cycle.status = "locked";
  cycle.lockedAt = new Date();
  await cycle.save();

  await writeAuditLog(req, "PAYROLL_CYCLE_LOCKED", "Payroll cycle locked", { payrollCycleId: cycle._id });
  return sendSuccess(res, { message: "Payroll cycle locked", data: cycle });
});

export const payPayrollCycle = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const { transactionRefPrefix } = req.body;
  const cycle = await PayrollCycle.findOne({ _id: req.params.id, schoolId });

  if (!cycle) throw new ApiError(404, "Payroll cycle not found");
  if (cycle.status !== "locked") throw new ApiError(400, "Only locked cycles can be marked as paid");

  const now = new Date();
  const entries = await PayrollEntry.find({ payrollCycleId: cycle._id, paymentStatus: "pending" });

  for (const entry of entries) {
    entry.paymentStatus = "paid";
    entry.paidAt = now;
    entry.transactionRef = transactionRefPrefix
      ? `${transactionRefPrefix}-${entry.employeeId}`
      : `PAY-${cycle.year}${String(cycle.month).padStart(2, "0")}-${entry.employeeId}`;
    await entry.save();
  }

  cycle.status = "paid";
  cycle.paidAt = now;
  await cycle.save();

  await writeAuditLog(req, "PAYROLL_CYCLE_PAID", "Payroll cycle marked as paid", {
    payrollCycleId: cycle._id,
    paidEntries: entries.length,
  });

  return sendSuccess(res, { message: "Payroll cycle paid", data: { cycle, paidEntries: entries.length } });
});

export const getPayslip = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.params;
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);

  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) }).lean();
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const entry = await PayrollEntry.findOne({ payrollCycleId: cycle._id, employeeId })
    .populate({ path: "employeeId", select: "department designation userId", populate: { path: "userId", select: "name email" } })
    .lean();

  if (!entry) throw new ApiError(404, "Payslip not found for employee");

  const isSelf = req.user?._id?.toString() === entry.employeeId?.userId?._id?.toString();
  if (!isSelf && ["Teacher", "Employee", "Staff", "Support Staff"].includes(req.userRole?.name)) {
    throw new ApiError(403, "You can only view your own payslip");
  }

  return sendSuccess(res, { message: "Payslip fetched", data: { cycle, entry } });
});
export const getMyPayrollSummary = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const limit = Math.min(Number(req.query.limit) || 12, 24);

  const employee = await Employee.findOne({ schoolId, userId: req.user._id })
    .populate({ path: "userId", select: "name email" })
    .lean();

  if (!employee) throw new ApiError(404, "Employee payroll profile not found");

  const structure = await PayrollStructure.findOne({
    schoolId,
    employeeId: employee._id,
    status: "active",
  })
    .sort({ effectiveFrom: -1 })
    .lean();

  const entries = await PayrollEntry.find({ schoolId, employeeId: employee._id })
    .populate({ path: "payrollCycleId", select: "month year status paidAt lockedAt" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const payslips = entries
    .filter((entry) => entry.payrollCycleId)
    .map((entry) => ({
      _id: entry._id,
      cycle: entry.payrollCycleId,
      month: entry.payrollCycleId.month,
      year: entry.payrollCycleId.year,
      workingDays: entry.workingDays,
      presentDays: entry.presentDays,
      paidLeaves: entry.paidLeaves,
      lopDays: entry.lopDays,
      grossEarnings: entry.grossEarnings,
      totalDeductions: entry.totalDeductions,
      netPay: entry.netPay,
      paymentStatus: entry.paymentStatus,
      paidAt: entry.paidAt,
      transactionRef: entry.transactionRef,
      earningsBreakdown: entry.earningsBreakdown,
      deductionsBreakdown: entry.deductionsBreakdown,
      warnings: entry.warnings || [],
    }));

  return sendSuccess(res, {
    message: "My payroll summary fetched",
    data: { employee, structure, payslips },
  });
});

export const getMonthlyPayrollReport = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const { month, year } = req.query;

  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) });
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const [summary] = await PayrollEntry.aggregate([
    { $match: { payrollCycleId: new mongoose.Types.ObjectId(cycle._id) } },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalGross: { $sum: "$grossEarnings" },
        totalDeductions: { $sum: "$totalDeductions" },
        totalNetPay: { $sum: "$netPay" },
        unpaidCount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0],
          },
        },
      },
    },
  ]);

  return sendSuccess(res, {
    message: "Monthly payroll report fetched",
    data: {
      cycle,
      summary: summary || {
        totalEmployees: 0,
        totalGross: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        unpaidCount: 0,
      },
    },
  });
});

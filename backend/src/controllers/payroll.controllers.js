import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import ActivityLog from "../models/ActivityLog.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Employee } from "../models/Employee.model.js";
import { School } from "../models/school.model.js";
import { PayrollCycle } from "../models/payrollCycle.model.js";
import { PayrollEntry } from "../models/payrollEntry.model.js";
import { PayrollPolicy } from "../models/payrollPolicy.model.js";
import { PayrollStructure } from "../models/payrollStructure.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { calculatePayrollEntry } from "../services/payrollCalculator.service.js";

// Roles allowed to view/download any employee's payslip for payroll administration —
// everyone else may only fetch their own, enforced in fetchAuthorizedPayslip() below.
const PAYSLIP_ADMIN_ROLES = ["Super Admin", "School Admin", "Accountant", "Principal", "Admin"];

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

// Resolves the PayrollPolicy version in effect for a given payroll-cycle date — the latest
// version whose effectiveFrom is on or before that date. This is how government rate changes
// (PF %, ESI ceiling, etc.) are handled without touching code: insert a new policy version
// with the new effectiveFrom, and every cycle before that date keeps using the old rates.
// Bootstraps a default (statutory-default) version for schools that have never configured one.
const resolvePayrollPolicy = async ({ schoolId, asOfDate }) => {
  let policy = await PayrollPolicy.findOne({
    schoolId,
    effectiveFrom: { $lte: asOfDate },
  }).sort({ effectiveFrom: -1 });

  if (!policy) {
    policy = await PayrollPolicy.create({ schoolId, effectiveFrom: new Date("2000-01-01") });
  }

  return policy;
};

// Pure summarizer — takes an already-fetched slice of Attendance records for one employee
// rather than querying, so a whole cycle's worth of employees can share a single batched
// Attendance.find() instead of one query per employee (see generatePayrollCycle).
const summarizeAttendanceRecords = (records) => {
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
  const lateCount = statusCount.late;
  const overtimeHours = records.reduce((acc, record) => {
    if (!record?.checkInAt || !record?.checkOutAt) return acc;
    const workedMs = new Date(record.checkOutAt).getTime() - new Date(record.checkInAt).getTime();
    if (workedMs <= 0) return acc;
    const workedHours = workedMs / (1000 * 60 * 60);
    return acc + Math.max(workedHours - 8, 0);
  }, 0);

  return {
    workingDays,
    presentDays,
    leaveDays,
    lateCount,
    overtimeHours: Number(overtimeHours.toFixed(2)),
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


  if (cycle && cycle.status !== "draft") {
    throw new ApiError(
      409,
      `Payroll cycle already ${cycle.status}. Locked or paid payroll cycle cannot be regenerated`
    );
  }

  const employees = await Employee.find({
    schoolId,
    isActive: true,
  }).select("_id userId statutoryCompliance").lean();
  if (!employees.length) {
    throw new ApiError(400, "No active employees found for this school");
  }

  const { end: policyAsOfDate } = monthRangeUTC({ month, year });
  const policy = await resolvePayrollPolicy({ schoolId, asOfDate: policyAsOfDate });
  const cycleType = req.body.cycleType || "monthly";
  const cycleStartDate = req.body.cycleStartDate ? new Date(req.body.cycleStartDate) : null;
  const cycleEndDate = req.body.cycleEndDate ? new Date(req.body.cycleEndDate) : null;

  if (cycleType === "custom" && (!cycleStartDate || !cycleEndDate)) {
    throw new ApiError(400, "cycleStartDate and cycleEndDate are required for custom cycle");
  }
  const createdNewCycle = !cycle;

  if (!cycle) {
    cycle = await PayrollCycle.create({
      schoolId,
      month,
      year,
      cycleType,
      cycleStartDate,
      cycleEndDate,
      status: "draft",
      processedBy: req.user._id,
    });
  }

  const entries = [];

  const cycleStart = new Date(Date.UTC(year, month - 1, 1));
  const cycleEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const employeeIds = employees.map((e) => e._id);
  const userIds = employees.map((e) => e.userId);

  // Batch-fetch every structure that could apply to any of these employees in one query
  // (was one findOne() per employee), most-recent-first, then keep only the first per
  // employee in memory — same "latest effective version wins" rule as before.
  const allStructures = await PayrollStructure.find({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    employeeId: { $in: employeeIds },
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

  const structureByEmployee = new Map();
  for (const s of allStructures) {
    const key = String(s.employeeId);
    if (!structureByEmployee.has(key)) structureByEmployee.set(key, s);
  }

  // Batch-fetch the whole month's attendance for every employee in one query (was one
  // Attendance.find() per employee), then group by userId in memory.
  const { start: attStart, end: attEnd } = monthRangeUTC({ month, year });
  const allAttendance = await Attendance.find({
    schoolId,
    userId: { $in: userIds },
    role: { $in: ["teacher", "staff"] },
    date: { $gte: attStart, $lte: attEnd },
  })
    .select("userId status checkInAt checkOutAt")
    .lean();

  const attendanceByUser = new Map();
  for (const rec of allAttendance) {
    const key = String(rec.userId);
    if (!attendanceByUser.has(key)) attendanceByUser.set(key, []);
    attendanceByUser.get(key).push(rec);
  }

 for (const employee of employees) {
  const structure = structureByEmployee.get(String(employee._id));

  if (!structure) continue;

  const records = attendanceByUser.get(String(employee.userId)) || [];
  const attendance = summarizeAttendanceRecords(records);

  const calculated = calculatePayrollEntry({
    structure,
    attendance,
    policy,
    employeeStatutory: employee.statutoryCompliance,
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
    employerContributions: calculated.employerContributions,
    statutorySnapshot: {
      uan: employee.statutoryCompliance?.uan || null,
      esicNumber: employee.statutoryCompliance?.esicNumber || null,
    },
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

export const getLatestPayrollCycle = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);

  const cycle = await PayrollCycle.findOne({ schoolId })
    .sort({ year: -1, month: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Latest payroll cycle fetched",
    data: cycle ? { month: cycle.month, year: cycle.year, status: cycle.status } : null,
  });
});

export const getPayrollCycle = asyncHandler(async (req, res) => {
  const { month, year } = req.params;
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) }).lean();
  
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const entries = await PayrollEntry.find({ payrollCycleId: cycle._id })
    .populate({ path: "employeeId", select: "department designation userId", populate: { path: "userId", select: "name email" } })
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
  const { transactionRefPrefix, paymentMode } = req.body;
  const cycle = await PayrollCycle.findOne({ _id: req.params.id, schoolId });

  if (!cycle) throw new ApiError(404, "Payroll cycle not found");
  if (cycle.status !== "locked") throw new ApiError(400, "Only locked cycles can be marked as paid");

  const now = new Date();
  const entries = await PayrollEntry.find({ payrollCycleId: cycle._id, paymentStatus: "pending" });

  for (const entry of entries) {
    entry.paymentStatus = "paid";
    entry.paymentMode = paymentMode || "bank";
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

// Shared by getPayslip (JSON) and downloadPayslipPdf (PDF) — one fetch-and-authorize path so
// the "can this user see this payslip" rule only lives in one place.
const fetchAuthorizedPayslip = async ({ req, employeeId, month, year }) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);

  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) }).lean();
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const entry = await PayrollEntry.findOne({ payrollCycleId: cycle._id, employeeId })
    .populate({ path: "employeeId", select: "department designation userId", populate: { path: "userId", select: "name email" } })
    .lean();

  if (!entry) throw new ApiError(404, "Payslip not found for employee");

  const isSelf = req.user?._id?.toString() === entry.employeeId?.userId?._id?.toString();
  if (!isSelf && !PAYSLIP_ADMIN_ROLES.includes(req.userRole?.name)) {
    throw new ApiError(403, "You can only view your own payslip");
  }

  return { cycle, entry, schoolId };
};

export const getPayslip = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.params;
  const { cycle, entry } = await fetchAuthorizedPayslip({ req, employeeId, month, year });
  return sendSuccess(res, { message: "Payslip fetched", data: { cycle, entry } });
});

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const money = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const downloadPayslipPdf = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.params;
  const { entry, schoolId } = await fetchAuthorizedPayslip({ req, employeeId, month, year });
  const school = await School.findById(schoolId).select("name address").lean();

  const employeeName = entry.employeeId?.userId?.name || "Employee";
  const monthLabel = `${MONTH_NAMES[Number(month)]} ${year}`;
  const fileSafeName = employeeName.replace(/[^a-z0-9]+/gi, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Payslip_${fileSafeName}_${monthLabel.replace(" ", "_")}.pdf`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(16).font("Helvetica-Bold").text(school?.name || "School", { align: "center" });
  if (school?.address) doc.fontSize(9).font("Helvetica").fillColor("#555").text(school.address, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(13).font("Helvetica-Bold").fillColor("#000").text(`Payslip — ${monthLabel}`, { align: "center" });
  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#ccc").stroke();
  doc.moveDown();

  doc.fontSize(10).font("Helvetica");
  doc.text(`Employee: ${employeeName}`);
  doc.text(`Designation: ${entry.employeeId?.designation || "—"}   Department: ${entry.employeeId?.department || "—"}`);
  if (entry.statutorySnapshot?.uan) doc.text(`UAN: ${entry.statutorySnapshot.uan}`);
  if (entry.statutorySnapshot?.esicNumber) doc.text(`ESIC Number: ${entry.statutorySnapshot.esicNumber}`);
  doc.text(`Working Days: ${entry.workingDays}   Present Days: ${entry.presentDays}   LOP Days: ${entry.lopDays}`);
  doc.moveDown();

  const twoCol = (label, value, y) => {
    doc.font("Helvetica").text(label, 40, y);
    doc.font("Helvetica-Bold").text(value, 300, y, { width: 215, align: "right" });
  };

  doc.fontSize(11).font("Helvetica-Bold").text("Earnings", 40, doc.y);
  doc.moveDown(0.3);
  const earnings = entry.earningsBreakdown || {};
  let y = doc.y;
  [
    ["Basic", earnings.basic], ["HRA", earnings.hra], ["DA", earnings.da],
    ["Special Allowance", earnings.specialAllowance], ["Overtime", earnings.overtimePay],
    ["Reimbursements", earnings.reimbursements],
  ].forEach(([label, value]) => { twoCol(label, money(value), y); y += 16; });
  doc.y = y + 4;

  doc.fontSize(11).font("Helvetica-Bold").text("Deductions", 40, doc.y);
  doc.moveDown(0.3);
  const deductions = entry.deductionsBreakdown || {};
  y = doc.y;
  twoCol("LOP Deduction", money(deductions.lopDeduction), y); y += 16;
  twoCol("PF (Employee)", money(deductions.statutoryPf), y); y += 16;
  if (deductions.vpf > 0) { twoCol("VPF (Voluntary)", money(deductions.vpf), y); y += 16; }
  twoCol("ESI (Employee)", deductions.esiEligible ? money(deductions.esi) : "Not applicable", y); y += 16;
  twoCol("Professional Tax", money(deductions.professionalTax), y); y += 16;
  twoCol("TDS", money(deductions.tds), y); y += 16;
  if (deductions.lateFine > 0) { twoCol("Late Fine", money(deductions.lateFine), y); y += 16; }
  if (deductions.otherDeductions > 0) { twoCol("Other Deductions", money(deductions.otherDeductions), y); y += 16; }
  doc.y = y + 4;

  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#ccc").stroke();
  doc.moveDown(0.5);
  y = doc.y;
  doc.fontSize(11);
  twoCol("Gross Earnings", money(entry.grossEarnings), y); y += 18;
  twoCol("Total Deductions", money(entry.totalDeductions), y); y += 18;
  doc.fontSize(13);
  twoCol("Net Pay", money(entry.netPay), y); y += 24;
  doc.y = y;

  const employer = entry.employerContributions || {};
  if ((employer.pfTotal || 0) > 0 || (employer.esi || 0) > 0) {
    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Oblique").fillColor("#555")
      .text("Employer contributions (not deducted from pay, shown for reference):");
    doc.moveDown(0.3);
    y = doc.y;
    doc.fontSize(9).font("Helvetica");
    twoCol("Employer EPS", money(employer.eps), y); y += 14;
    twoCol("Employer EPF", money(employer.epf), y); y += 14;
    twoCol("EPF Admin Charges", money(employer.epfAdminCharges), y); y += 14;
    twoCol("EDLI", money(employer.edli), y); y += 14;
    twoCol("Employer ESI", money(employer.esi), y); y += 14;
    doc.y = y;
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor("#999").font("Helvetica")
    .text("This is a system-generated payslip and does not require a signature.", { align: "center" });

  doc.end();
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
      paymentMode: entry.paymentMode,
      paidAt: entry.paidAt,
      transactionRef: entry.transactionRef,
      earningsBreakdown: entry.earningsBreakdown,
      deductionsBreakdown: entry.deductionsBreakdown,
      employerContributions: entry.employerContributions,
      statutorySnapshot: entry.statutorySnapshot,
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

// ══════════════════════════════════════════════════════════════════════════════
// Payroll Settings (versioned PayrollPolicy) — PF/ESI/PT/rounding/etc. configuration
// ══════════════════════════════════════════════════════════════════════════════

// Creates a new settings *version* rather than editing one in place, so historical
// payroll cycles keep calculating with the rates that were actually in force at the time.
export const createPayrollSettings = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);

  const duplicate = await PayrollPolicy.findOne({
    schoolId,
    effectiveFrom: new Date(req.body.effectiveFrom),
  });
  if (duplicate) {
    throw new ApiError(409, "A settings version already exists with this effective date");
  }

  const settings = await PayrollPolicy.create({
    ...req.body,
    schoolId,
    createdBy: req.user._id,
  });

  await writeAuditLog(req, "PAYROLL_SETTINGS_CREATED", "Payroll settings version created", {
    payrollPolicyId: settings._id,
    effectiveFrom: settings.effectiveFrom,
  });

  return sendSuccess(res, { statusCode: 201, message: "Payroll settings version created", data: settings });
});

// Lists all versions (newest first) plus which one is currently effective, so the settings
// screen can show history and let an admin see exactly what will apply to a new cycle today.
export const getPayrollSettings = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);

  // resolvePayrollPolicy() auto-bootstraps a default version on a school's first-ever call if
  // none exists — must run before the versions list is queried, or that very first response
  // shows a "current" version that's nowhere in "versions" (only fixes itself on the next
  // request, once the bootstrap doc has actually been persisted).
  const current = await resolvePayrollPolicy({ schoolId, asOfDate: new Date() });
  const versions = await PayrollPolicy.find({ schoolId }).sort({ effectiveFrom: -1 }).lean();

  return sendSuccess(res, {
    message: "Payroll settings fetched",
    data: { versions, current },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Employee statutory (PF/ESI) details
// ══════════════════════════════════════════════════════════════════════════════

export const updateEmployeeStatutory = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const { employeeId } = req.params;

  const employee = await Employee.findOne({ _id: employeeId, schoolId });
  if (!employee) throw new ApiError(404, "Employee not found for this school");

  // Duplicate UAN/ESIC across employees would corrupt PF/ESI filings — reject early.
  if (req.body.uan) {
    const uanTaken = await Employee.exists({
      schoolId,
      _id: { $ne: employeeId },
      "statutoryCompliance.uan": req.body.uan,
    });
    if (uanTaken) throw new ApiError(409, "This UAN is already assigned to another employee");
  }
  if (req.body.esicNumber) {
    const esicTaken = await Employee.exists({
      schoolId,
      _id: { $ne: employeeId },
      "statutoryCompliance.esicNumber": req.body.esicNumber,
    });
    if (esicTaken) throw new ApiError(409, "This ESIC number is already assigned to another employee");
  }

  employee.statutoryCompliance = {
    ...employee.statutoryCompliance?.toObject?.() ?? employee.statutoryCompliance ?? {},
    ...req.body,
  };
  await employee.save();

  await writeAuditLog(req, "EMPLOYEE_STATUTORY_UPDATED", "Employee PF/ESI details updated", {
    employeeId,
    fields: Object.keys(req.body),
  });

  return sendSuccess(res, { message: "Employee statutory details updated", data: employee.statutoryCompliance });
});

// ══════════════════════════════════════════════════════════════════════════════
// PF / ESI statutory reports
// ══════════════════════════════════════════════════════════════════════════════

const escapeCsvCell = (value) => `"${`${value ?? ""}`.replace(/"/g, '""')}"`;
const toCsv = (headers, rows) => [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");

const sendCsvOrJson = (res, { isExport, fileName, headers, rows, message, data }) => {
  if (isExport) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(toCsv(headers, rows));
  }
  return sendSuccess(res, { message, data });
};

// Monthly PF report — one row per employee with PF-enabled pay, employee + employer
// contribution split (EPS/EPF/admin charges/EDLI), for EPFO ECR filing reference.
export const getPfReport = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const { month, year } = req.query;
  const isExport = req.query.export === "csv";

  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) }).lean();
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const entries = await PayrollEntry.find({ payrollCycleId: cycle._id, "deductionsBreakdown.pf": { $gt: 0 } })
    .populate({ path: "employeeId", select: "userId", populate: { path: "userId", select: "name" } })
    .lean();

  const rows = entries.map((entry) => ({
    employeeName: entry.employeeId?.userId?.name || "—",
    uan: entry.statutorySnapshot?.uan || "—",
    pfWage: entry.deductionsBreakdown?.pfWage || 0,
    employeePf: entry.deductionsBreakdown?.statutoryPf || 0,
    vpf: entry.deductionsBreakdown?.vpf || 0,
    employerEps: entry.employerContributions?.eps || 0,
    employerEpf: entry.employerContributions?.epf || 0,
    epfAdminCharges: entry.employerContributions?.epfAdminCharges || 0,
    edli: entry.employerContributions?.edli || 0,
  }));

  return sendCsvOrJson(res, {
    isExport,
    fileName: `pf-report-${year}-${String(month).padStart(2, "0")}.csv`,
    headers: ["Employee", "UAN", "PF Wage", "Employee PF", "VPF", "Employer EPS", "Employer EPF", "EPF Admin Charges", "EDLI"],
    rows: rows.map((r) => [r.employeeName, r.uan, r.pfWage, r.employeePf, r.vpf, r.employerEps, r.employerEpf, r.epfAdminCharges, r.edli]),
    message: "PF report fetched",
    data: { cycle, rows },
  });
});

// Monthly ESI report — one row per ESI-eligible employee with employee + employer share,
// for ESIC return filing reference.
export const getEsiReport = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  assertSchoolId(schoolId);
  const { month, year } = req.query;
  const isExport = req.query.export === "csv";

  const cycle = await PayrollCycle.findOne({ schoolId, month: Number(month), year: Number(year) }).lean();
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");

  const entries = await PayrollEntry.find({ payrollCycleId: cycle._id, "deductionsBreakdown.esiEligible": true })
    .populate({ path: "employeeId", select: "userId", populate: { path: "userId", select: "name" } })
    .lean();

  const rows = entries.map((entry) => ({
    employeeName: entry.employeeId?.userId?.name || "—",
    esicNumber: entry.statutorySnapshot?.esicNumber || "—",
    esiWage: entry.deductionsBreakdown?.esiWage || 0,
    employeeEsi: entry.deductionsBreakdown?.esi || 0,
    employerEsi: entry.employerContributions?.esi || 0,
  }));

  return sendCsvOrJson(res, {
    isExport,
    fileName: `esi-report-${year}-${String(month).padStart(2, "0")}.csv`,
    headers: ["Employee", "ESIC Number", "ESI Wage", "Employee ESI", "Employer ESI"],
    rows: rows.map((r) => [r.employeeName, r.esicNumber, r.esiWage, r.employeeEsi, r.employerEsi]),
    message: "ESI report fetched",
    data: { cycle, rows },
  });
});

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { Employee } from "../models/Employee.model.js";
import { PayrollStructure } from "../models/payrollStructure.model.js";
import { PayrollRun } from "../models/PayrollRun.model.js";
import { PayrollItem } from "../models/PayrollItem.model.js";
import { TaxConfiguration } from "../models/TaxConfiguration.model.js";
import { LoanAdvance } from "../models/LoanAdvance.model.js";
import { ApprovalLog } from "../models/ApprovalLog.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { Reimbursement } from "../models/Reimbursement.model.js";
import { BonusIncentive } from "../models/BonusIncentive.model.js";
import { PayrollAuditLog } from "../models/PayrollAuditLog.model.js";
import { BankTransfer } from "../models/BankTransfer.model.js";
import { ComplianceFiling } from "../models/ComplianceFiling.model.js";
import { computeSalary } from "../services/enterprisePayroll.service.js";

const ensureObjectId = (value, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) throw new ApiError(400, `Invalid ${label}`);
};

const resolveSchoolId = (req) => {
  const schoolId = req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID missing from user session.");
  ensureObjectId(schoolId, "school");
  return schoolId;
};

const resolveAcademicYearId = async (req, schoolId) => {
  const requestedAcademicYearId = req.body?.academicYearId || req.query?.academicYearId || req.academicYearId || req.user?.academicYearId;

  if (requestedAcademicYearId) {
    ensureObjectId(requestedAcademicYearId, "academicYearId");
    const academicYear = await AcademicYear.findOne({ _id: requestedAcademicYearId, schoolId }).select("_id").lean();
    if (!academicYear) throw new ApiError(400, "Academic year not found for this school");
    return academicYear._id;
  }

  const activeAcademicYear = await AcademicYear.findOne({ schoolId, isActive: true, status: "active" }).select("_id").lean();
  if (!activeAcademicYear) throw new ApiError(400, "No active academic year found. Please activate an academic year first.");
  return activeAcademicYear._id;
};

const context = async (req) => {
  const schoolId = resolveSchoolId(req);
  const academicYearId = await resolveAcademicYearId(req, schoolId);
  return { schoolId, academicYearId, createdBy: req.user._id };
};

const writePayrollAudit = async (req, base, entityType, entityId, action, summary, before = null, after = null) => {
  await PayrollAuditLog.create({
    schoolId: base.schoolId,
    academicYearId: base.academicYearId,
    actorId: req.user._id,
    entityType,
    entityId,
    action,
    summary,
    before,
    after,
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
    userAgent: req.headers["user-agent"] || "",
  });
};

const populateRun = (query) => query.populate("createdBy", "name email").populate("approvedBy", "name email");
const populateLoan = (query) =>
  query
    .populate({ path: "employeeId", select: "employeeCode designation department employeeStatus userId", populate: { path: "userId", select: "name email regId" } })
    .populate("createdBy", "name email");
const populateClaim = (query) =>
  query.populate({ path: "employeeId", select: "employeeCode designation department userId", populate: { path: "userId", select: "name email regId" } }).populate("createdBy", "name email");

export const createTaxConfiguration = asyncHandler(async (req, res) => {
  const base = await context(req);
  await TaxConfiguration.updateMany({ schoolId: base.schoolId, academicYearId: base.academicYearId }, { $set: { isActive: false } });
  const doc = await TaxConfiguration.create({ ...req.body, ...base, isActive: true });
  await writePayrollAudit(req, base, "TaxConfiguration", doc._id, "TAX_CONFIG_UPDATED", "Payroll tax and statutory rates updated", null, doc.toObject());
  return sendSuccess(res, { statusCode: 201, message: "Tax configuration saved", data: doc });
});

export const getActiveTaxConfiguration = asyncHandler(async (req, res) => {
  const base = await context(req);
  const doc = await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true }).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { message: "Tax configuration fetched", data: doc });
});

export const createLoanRequest = asyncHandler(async (req, res) => {
  const base = await context(req);
  const { employeeId, totalAmount, emiAmount, startMonth } = req.body;
  ensureObjectId(employeeId, "employee");
  const employee = await Employee.findOne({ _id: employeeId, schoolId: base.schoolId, isActive: true }).lean();
  if (!employee) throw new ApiError(404, "Employee not found");
  const amount = Number(totalAmount);
  const emi = Number(emiAmount);
  if (!amount || amount < 1) throw new ApiError(400, "Total amount must be greater than 0");
  if (!emi || emi < 1) throw new ApiError(400, "EMI amount must be greater than 0");
  if (emi > amount) throw new ApiError(400, "EMI amount cannot exceed total loan amount");

  const doc = await LoanAdvance.create({ ...base, employeeId, totalAmount: amount, remainingAmount: amount, emiAmount: emi, startMonth: startMonth ? new Date(startMonth) : new Date(), history: [{ action: "created", actedBy: req.user._id, amount }] });
  await writePayrollAudit(req, base, "LoanAdvance", doc._id, "LOAN_CREATED", "Employee loan/advance request created", null, doc.toObject());
  const populated = await populateLoan(LoanAdvance.findById(doc._id)).lean();
  return sendSuccess(res, { statusCode: 201, message: "Loan request created", data: populated });
});

export const approveLoan = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "loan");
  const loan = await LoanAdvance.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!loan) throw new ApiError(404, "Loan request not found");
  if (loan.status !== "pending") throw new ApiError(400, "Only pending loan requests can be approved");
  const before = loan.toObject();
  loan.status = "active";
  loan.history.push({ action: "approved", actedBy: req.user._id, note: req.body.comment || "" });
  await loan.save();
  await writePayrollAudit(req, base, "LoanAdvance", loan._id, "LOAN_APPROVED", "Employee loan/advance approved", before, loan.toObject());
  const populated = await populateLoan(LoanAdvance.findById(loan._id)).lean();
  return sendSuccess(res, { message: "Loan approved", data: populated });
});

export const rejectLoan = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "loan");
  const loan = await LoanAdvance.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!loan) throw new ApiError(404, "Loan request not found");
  if (loan.status !== "pending") throw new ApiError(400, "Only pending loan requests can be rejected");
  const before = loan.toObject();
  loan.status = "rejected";
  loan.rejectionReason = req.body.reason || req.body.comment || "Rejected by approver";
  loan.history.push({ action: "rejected", actedBy: req.user._id, note: loan.rejectionReason });
  await loan.save();
  await writePayrollAudit(req, base, "LoanAdvance", loan._id, "LOAN_REJECTED", "Employee loan/advance rejected", before, loan.toObject());
  const populated = await populateLoan(LoanAdvance.findById(loan._id)).lean();
  return sendSuccess(res, { message: "Loan rejected", data: populated });
});

export const createBonusIncentive = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.body.employeeId, "employee");
  const employee = await Employee.findOne({ _id: req.body.employeeId, schoolId: base.schoolId, isActive: true }).select("_id").lean();
  if (!employee) throw new ApiError(404, "Employee not found");
  const doc = await BonusIncentive.create({ ...req.body, ...base, amount: Number(req.body.amount) });
  await writePayrollAudit(req, base, "BonusIncentive", doc._id, "BONUS_CREATED", "Bonus/incentive payout configured", null, doc.toObject());
  return sendSuccess(res, { statusCode: 201, message: "Bonus/incentive saved", data: doc });
});

export const createReimbursement = asyncHandler(async (req, res) => {
  const base = await context(req);
  const employeeId = req.body.employeeId;
  ensureObjectId(employeeId, "employee");
  const employee = await Employee.findOne({ _id: employeeId, schoolId: base.schoolId, isActive: true }).select("_id").lean();
  if (!employee) throw new ApiError(404, "Employee not found");
  const doc = await Reimbursement.create({ ...base, ...req.body, amount: Number(req.body.amount) });
  await writePayrollAudit(req, base, "Reimbursement", doc._id, "REIMBURSEMENT_CREATED", "Employee reimbursement claim created", null, doc.toObject());
  const populated = await populateClaim(Reimbursement.findById(doc._id)).lean();
  return sendSuccess(res, { statusCode: 201, message: "Reimbursement claim created", data: populated });
});

export const approveReimbursement = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "reimbursement");
  const claim = await Reimbursement.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!claim) throw new ApiError(404, "Reimbursement not found");
  if (!["pending_manager", "pending_finance"].includes(claim.status)) throw new ApiError(400, "Claim cannot be approved in current status");
  const before = claim.toObject();
  const level = claim.status === "pending_manager" ? "manager" : "finance";
  claim.approvals = claim.approvals.map((item) => {
    const approval = typeof item.toObject === "function" ? item.toObject() : item;
    return item.level === level ? { ...approval, status: "approved", actedBy: req.user._id, actedAt: new Date(), remark: req.body.comment || "" } : approval;
  });
  claim.status = claim.status === "pending_manager" ? "pending_finance" : "approved";
  await claim.save();
  await writePayrollAudit(req, base, "Reimbursement", claim._id, "REIMBURSEMENT_APPROVED", `${level} approved reimbursement`, before, claim.toObject());
  const populated = await populateClaim(Reimbursement.findById(claim._id)).lean();
  return sendSuccess(res, { message: "Reimbursement approved", data: populated });
});

export const getReimbursements = asyncHandler(async (req, res) => {
  const base = await context(req);
  const filter = { schoolId: base.schoolId, academicYearId: base.academicYearId };
  if (req.query.status) filter.status = req.query.status;
  const claims = await populateClaim(Reimbursement.find(filter).sort({ createdAt: -1 })).lean();
  return sendSuccess(res, { message: "Reimbursements fetched", data: claims });
});

export const generatePayrollRun = asyncHandler(async (req, res) => {
  const base = await context(req);
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  if (!month || month < 1 || month > 12) throw new ApiError(400, "Valid month is required");
  if (!year || year < 2000) throw new ApiError(400, "Valid year is required");

  const existing = await PayrollRun.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, month, year, status: { $ne: "rolled_back" } });
  if (existing) throw new ApiError(409, "Payroll run already exists for this period");

  const employees = await Employee.find({ schoolId: base.schoolId, isActive: true }).select("_id department designation").lean();
  const taxConfig = (await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true }).sort({ createdAt: -1 }).lean()) || {};
  const run = await PayrollRun.create({ ...base, month, year, cycleType: req.body.cycleType || "monthly", periodStart: req.body.periodStart || null, periodEnd: req.body.periodEnd || null, status: "processing" });
  const items = [];

  for (const employee of employees) {
    const structure = await PayrollStructure.findOne({ schoolId: base.schoolId, employeeId: employee._id, status: "active" }).sort({ effectiveFrom: -1 }).lean();
    if (!structure) continue;
    const loan = await LoanAdvance.findOne({ schoolId: base.schoolId, employeeId: employee._id, status: "active", remainingAmount: { $gt: 0 } }).lean();
    const loanEmi = loan ? Math.min(Number(loan.emiAmount || 0), Number(loan.remainingAmount || 0)) : 0;
    const reimbursements = await Reimbursement.find({ schoolId: base.schoolId, academicYearId: base.academicYearId, employeeId: employee._id, status: "approved" }).lean();
    const bonuses = await BonusIncentive.find({ schoolId: base.schoolId, academicYearId: base.academicYearId, employeeId: employee._id, payoutMonth: month, payoutYear: year, status: "approved" }).lean();
    const attendance = req.body.attendanceByEmployee?.[String(employee._id)] || { workingDays: Number(req.body.workingDays || 30), lopDays: Number(req.body.lopDays || 0), lateMarks: Number(req.body.lateMarks || 0), overtimeHours: Number(req.body.overtimeHours || 0) };
    const leave = req.body.leaveByEmployee?.[String(employee._id)] || {};
    const salary = computeSalary({ structure, taxConfig, loanEmi, attendance, leave, reimbursements, bonuses, ruleEngine: req.body.ruleEngine || [] });
    items.push({
      ...base,
      payrollRunId: run._id,
      employeeId: employee._id,
      gross: salary.gross,
      deductions: salary.deductions,
      earnings: salary.earnings,
      totalDeductions: salary.totalDeductions,
      netSalary: salary.netSalary,
      attendance: salary.attendance,
      leave: salary.leave,
      reimbursements: reimbursements.map((item) => ({ _id: item._id, type: item.type, amount: item.amount })),
      bonuses: bonuses.map((item) => ({ _id: item._id, type: item.type, amount: item.amount })),
      compliance: salary.compliance,
      anomalyFlags: salary.anomalyFlags,
      leaveDeduction: salary.deductions.leaveDeduction,
      loanEmiDeduction: loanEmi,
    });
  }

  if (!items.length) {
    await PayrollRun.findByIdAndDelete(run._id);
    throw new ApiError(400, "No active salary structures found for payroll generation");
  }

  await PayrollItem.insertMany(items);
  run.status = "verified";
  run.totalEmployees = items.length;
  run.totalPayout = items.reduce((sum, item) => sum + item.netSalary, 0);
  run.totalEarnings = items.reduce((sum, item) => sum + item.gross, 0);
  run.totalDeductions = items.reduce((sum, item) => sum + item.totalDeductions, 0);
  run.pfLiability = items.reduce((sum, item) => sum + Number(item.deductions.pf || 0), 0);
  run.esiLiability = items.reduce((sum, item) => sum + Number(item.deductions.esi || 0), 0);
  run.tdsLiability = items.reduce((sum, item) => sum + Number(item.deductions.tds || 0), 0);
  run.analytics = { anomalyCount: items.reduce((sum, item) => sum + item.anomalyFlags.length, 0), generatedVia: "enterprise_engine" };
  await run.save();
  await writePayrollAudit(req, base, "PayrollRun", run._id, "PAYROLL_GENERATED", "Payroll generated with attendance, leave, loan, bonus and reimbursement integrations", null, run.toObject());
  return sendSuccess(res, { statusCode: 201, message: "Payroll run generated", data: run });
});

export const approvePayroll = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!run) throw new ApiError(404, "Payroll run not found");
  const nextMap = { verified: ["hr_approved", "hr"], hr_approved: ["accountant_approved", "accountant"], accountant_approved: ["principal_approved", "principal"], principal_approved: ["approved", "management"] };
  const next = nextMap[run.status];
  if (!next) throw new ApiError(400, "Payroll cannot be approved in current status");
  const before = run.toObject();
  run.status = next[0];
  run.approvedBy.addToSet(req.user._id);
  run.approvalTrail.push({ level: next[1], action: "approved", actorId: req.user._id, comment: req.body.comment || "", actedAt: new Date() });
  await run.save();
  await ApprovalLog.create({ ...base, payrollRunId: run._id, level: next[1], action: "approved", comment: req.body.comment || "" });
  await writePayrollAudit(req, base, "PayrollRun", run._id, "PAYROLL_APPROVED", `${next[1]} approved payroll`, before, run.toObject());
  return sendSuccess(res, { message: "Payroll approved", data: run });
});

export const markPayrollPaid = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOneAndUpdate({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId, status: "approved" }, { $set: { status: "paid" }, $push: { approvalTrail: { level: "accountant", action: "paid", actorId: req.user._id, comment: req.body.comment || "", actedAt: new Date() } } }, { new: true });
  if (!run) throw new ApiError(400, "Only approved payroll can be marked paid");
  await ApprovalLog.create({ ...base, payrollRunId: run._id, level: "accountant", action: "paid", comment: req.body.comment || "" });
  await writePayrollAudit(req, base, "PayrollRun", run._id, "PAYROLL_PAID", "Payroll marked paid", null, run.toObject());
  return sendSuccess(res, { message: "Payroll marked paid", data: run });
});

export const lockPayroll = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOneAndUpdate({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId, status: { $in: ["approved", "paid"] } }, { $set: { status: "locked" }, $push: { approvalTrail: { level: "management", action: "locked", actorId: req.user._id, comment: req.body.comment || "", actedAt: new Date() } } }, { new: true });
  if (!run) throw new ApiError(400, "Only approved or paid payroll can be locked");
  await ApprovalLog.create({ ...base, payrollRunId: run._id, level: "management", action: "locked", comment: req.body.comment || "" });
  await writePayrollAudit(req, base, "PayrollRun", run._id, "PAYROLL_LOCKED", "Payroll locked for audit-safe closure", null, run.toObject());
  return sendSuccess(res, { message: "Payroll locked", data: run });
});

export const rollbackPayroll = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!run) throw new ApiError(404, "Payroll run not found");
  if (run.status === "locked") throw new ApiError(400, "Locked payroll cannot be rolled back");
  const before = run.toObject();
  run.status = "rolled_back";
  run.approvalTrail.push({ level: "management", action: "rolled_back", actorId: req.user._id, comment: req.body.reason || "", actedAt: new Date() });
  await run.save();
  await ApprovalLog.create({ ...base, payrollRunId: run._id, level: "management", action: "rolled_back", comment: req.body.reason || "" });
  await writePayrollAudit(req, base, "PayrollRun", run._id, "PAYROLL_ROLLED_BACK", "Payroll rolled back for reprocess", before, run.toObject());
  return sendSuccess(res, { message: "Payroll rolled back", data: run });
});

export const payrollSummaryReport = asyncHandler(async (req, res) => {
  const base = await context(req);
  const match = { schoolId: new mongoose.Types.ObjectId(base.schoolId), academicYearId: new mongoose.Types.ObjectId(base.academicYearId) };
  const [runSummary] = await PayrollRun.aggregate([{ $match: match }, { $group: { _id: null, totalRuns: { $sum: 1 }, totalPayout: { $sum: "$totalPayout" }, employeesProcessed: { $sum: "$totalEmployees" }, totalDeductions: { $sum: "$totalDeductions" }, pfLiability: { $sum: "$pfLiability" }, esiLiability: { $sum: "$esiLiability" }, tdsLiability: { $sum: "$tdsLiability" }, pendingApprovals: { $sum: { $cond: [{ $in: ["$status", ["verified", "hr_approved", "accountant_approved", "principal_approved"]] }, 1, 0] } }, lockedRuns: { $sum: { $cond: [{ $eq: ["$status", "locked"] }, 1, 0] } } } }]);
  const headcount = await Employee.aggregate([{ $match: { schoolId: match.schoolId, isActive: true } }, { $group: { _id: "$department", count: { $sum: 1 } } }]);
  const loanSummary = await LoanAdvance.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 }, remaining: { $sum: "$remainingAmount" } } }]);
  const reimbursementSummary = await Reimbursement.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]);
  const complianceSummary = await ComplianceFiling.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]);
  const recentAuditLogs = await PayrollAuditLog.find({ schoolId: base.schoolId, academicYearId: base.academicYearId }).populate("actorId", "name email").sort({ createdAt: -1 }).limit(8).lean();
  const activeTaxConfig = await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true }).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { message: "Payroll summary report", data: { totalRuns: 0, totalPayout: 0, employeesProcessed: 0, totalDeductions: 0, pfLiability: 0, esiLiability: 0, tdsLiability: 0, pendingApprovals: 0, lockedRuns: 0, ...(runSummary || {}), headcount, loanSummary, reimbursementSummary, complianceSummary, recentAuditLogs, activeTaxConfig } });
});

export const getPayrollRuns = asyncHandler(async (req, res) => {
  const base = await context(req);
  const runs = await populateRun(PayrollRun.find({ schoolId: base.schoolId, academicYearId: base.academicYearId }).sort({ createdAt: -1 })).lean();
  return sendSuccess(res, { message: "Payroll runs fetched", data: runs });
});

export const getPayrollRunDetails = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await populateRun(PayrollRun.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId })).lean();
  if (!run) throw new ApiError(404, "Payroll run not found");
  const items = await PayrollItem.find({ payrollRunId: run._id }).populate({ path: "employeeId", select: "employeeCode designation department userId bankDetails", populate: { path: "userId", select: "name email regId" } }).sort({ netSalary: -1 }).lean();
  const approvals = await ApprovalLog.find({ payrollRunId: run._id }).populate("createdBy", "name email").sort({ createdAt: 1 }).lean();
  return sendSuccess(res, { message: "Payroll run details fetched", data: { run, items, approvals } });
});

export const generateBankTransfer = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!run) throw new ApiError(404, "Payroll run not found");
  const items = await PayrollItem.find({ payrollRunId: run._id }).populate({ path: "employeeId", select: "employeeCode bankDetails userId", populate: { path: "userId", select: "name" } }).lean();
  const rows = items.map((item) => ({ employeeCode: item.employeeId?.employeeCode || "", employeeName: item.employeeId?.userId?.name || "", accountNumber: item.employeeId?.bankDetails?.accountNumber || "", ifscCode: item.employeeId?.bankDetails?.ifscCode || "", amount: item.netSalary }));
  const transfer = await BankTransfer.findOneAndUpdate({ schoolId: base.schoolId, payrollRunId: run._id }, { ...base, payrollRunId: run._id, format: req.body.format || "bank_csv", totalAmount: run.totalPayout, totalEmployees: rows.length, fileName: `payroll-${run.month}-${run.year}-bank-transfer.csv`, rows }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await writePayrollAudit(req, base, "BankTransfer", transfer._id, "BANK_TRANSFER_GENERATED", "Bank transfer file generated", null, transfer.toObject());
  return sendSuccess(res, { message: "Bank transfer generated", data: transfer });
});

export const upsertComplianceFiling = asyncHandler(async (req, res) => {
  const base = await context(req);
  const { type, period } = req.body;
  if (!type || !period) throw new ApiError(400, "Compliance type and period are required");
  const filing = await ComplianceFiling.findOneAndUpdate({ schoolId: base.schoolId, academicYearId: base.academicYearId, type, period }, { ...req.body, ...base }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await writePayrollAudit(req, base, "ComplianceFiling", filing._id, "COMPLIANCE_UPDATED", "Compliance filing updated", null, filing.toObject());
  return sendSuccess(res, { statusCode: 201, message: "Compliance filing saved", data: filing });
});

export const getComplianceFilings = asyncHandler(async (req, res) => {
  const base = await context(req);
  const filings = await ComplianceFiling.find({ schoolId: base.schoolId, academicYearId: base.academicYearId }).sort({ dueDate: 1, createdAt: -1 }).lean();
  return sendSuccess(res, { message: "Compliance filings fetched", data: filings });
});

export const getEmployeeLoans = asyncHandler(async (req, res) => {
  const base = await context(req);
  const filter = { schoolId: base.schoolId, academicYearId: base.academicYearId };
  if (req.query.status) filter.status = req.query.status;
  const loans = await populateLoan(LoanAdvance.find(filter).sort({ createdAt: -1 })).lean();
  return sendSuccess(res, { message: "Loans fetched", data: loans });
});

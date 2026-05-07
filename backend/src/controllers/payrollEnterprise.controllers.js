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

  const activeAcademicYear = await AcademicYear.findOne({
    schoolId,
    isActive: true,
    status: "active",
  })
    .select("_id")
    .lean();

  if (!activeAcademicYear) {
    throw new ApiError(400, "No active academic year found. Please activate an academic year first.");
  }

  return activeAcademicYear._id;
};

const context = async (req) => {
  const schoolId = resolveSchoolId(req);
  const academicYearId = await resolveAcademicYearId(req, schoolId);

  return {
    schoolId,
    academicYearId,
    createdBy: req.user._id,
  };
};

const populateRun = (query) =>
  query.populate("createdBy", "name email").populate("approvedBy", "name email");

const populateLoan = (query) =>
  query
    .populate({ path: "employeeId", select: "designation department employeeStatus userId", populate: { path: "userId", select: "name email regId" } })
    .populate("createdBy", "name email");

export const createTaxConfiguration = asyncHandler(async (req, res) => {
  const base = await context(req);
  await TaxConfiguration.updateMany({ schoolId: base.schoolId, academicYearId: base.academicYearId }, { $set: { isActive: false } });
  const doc = await TaxConfiguration.create({ ...req.body, ...base, isActive: true });
  return sendSuccess(res, { statusCode: 201, message: "Tax configuration saved", data: doc });
});

export const getActiveTaxConfiguration = asyncHandler(async (req, res) => {
  const base = await context(req);
  const doc = await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
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

  const doc = await LoanAdvance.create({
    ...base,
    employeeId,
    totalAmount: amount,
    remainingAmount: amount,
    emiAmount: emi,
    startMonth: startMonth ? new Date(startMonth) : new Date(),
    history: [{ action: "created", actedBy: req.user._id, amount }],
  });
  const populated = await populateLoan(LoanAdvance.findById(doc._id)).lean();
  return sendSuccess(res, { statusCode: 201, message: "Loan request created", data: populated });
});

export const approveLoan = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "loan");
  const loan = await LoanAdvance.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!loan) throw new ApiError(404, "Loan request not found");
  if (loan.status !== "pending") throw new ApiError(400, "Only pending loan requests can be approved");
  loan.status = "active";
  loan.history.push({ action: "approved", actedBy: req.user._id, note: req.body.comment || "" });
  await loan.save();
  const populated = await populateLoan(LoanAdvance.findById(loan._id)).lean();
  return sendSuccess(res, { message: "Loan approved", data: populated });
});

export const rejectLoan = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "loan");
  const loan = await LoanAdvance.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!loan) throw new ApiError(404, "Loan request not found");
  if (loan.status !== "pending") throw new ApiError(400, "Only pending loan requests can be rejected");
  loan.status = "rejected";
  loan.rejectionReason = req.body.reason || req.body.comment || "Rejected by approver";
  loan.history.push({ action: "rejected", actedBy: req.user._id, note: loan.rejectionReason });
  await loan.save();
  const populated = await populateLoan(LoanAdvance.findById(loan._id)).lean();
  return sendSuccess(res, { message: "Loan rejected", data: populated });
});

export const generatePayrollRun = asyncHandler(async (req, res) => {
  const base = await context(req);
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new ApiError(400, "Month must be between 1 and 12");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new ApiError(400, "Year must be between 2000 and 2100");

  const existing = await PayrollRun.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, month, year }).lean();
  if (existing) throw new ApiError(409, "Payroll run already exists for selected month and year");

  const taxConfig = await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true }).lean();
  const employees = await Employee.find({ schoolId: base.schoolId, isActive: true }).select("_id").lean();
  const items = [];

  const run = await PayrollRun.create({ ...base, month, year });
  for (const employee of employees) {
    const structure = await PayrollStructure.findOne({ schoolId: base.schoolId, employeeId: employee._id, status: "active" }).sort({ effectiveFrom: -1 }).lean();
    if (!structure) continue;
    const loan = await LoanAdvance.findOne({ schoolId: base.schoolId, employeeId: employee._id, status: "active", remainingAmount: { $gt: 0 } }).lean();
    const loanEmi = loan ? Math.min(Number(loan.emiAmount || 0), Number(loan.remainingAmount || 0)) : 0;
    const attendance = { workingDays: Number(req.body.workingDays || 30), lopDays: Number(req.body.lopDays || 0) };
    const salary = computeSalary({ structure, taxConfig, loanEmi, attendance });
    items.push({
      ...base,
      payrollRunId: run._id,
      employeeId: employee._id,
      gross: salary.gross,
      deductions: salary.deductions,
      earnings: salary.earnings,
      totalDeductions: salary.totalDeductions,
      netSalary: salary.netSalary,
      attendance,
      leaveDeduction: salary.deductions.leaveDeduction,
      loanEmiDeduction: loanEmi,
    });
  }

  if (!items.length) {
    await PayrollRun.findByIdAndDelete(run._id);
    throw new ApiError(400, "No active salary structures found for payroll generation");
  }

  await PayrollItem.insertMany(items);
  run.totalEmployees = items.length;
  run.totalPayout = items.reduce((a, b) => a + b.netSalary, 0);
  await run.save();
  return sendSuccess(res, { statusCode: 201, message: "Payroll run generated", data: run });
});

export const approvePayroll = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOne({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId });
  if (!run) throw new ApiError(404, "Payroll run not found");
  const nextMap = { draft: "hr_approved", hr_approved: "accountant_approved", accountant_approved: "approved" };
  if (!nextMap[run.status]) throw new ApiError(400, "Payroll cannot be approved in current status");
  run.status = nextMap[run.status];
  run.approvedBy.addToSet(req.user._id);
  await run.save();
  await ApprovalLog.create({ ...base, payrollRunId: run._id, level: run.status === "hr_approved" ? "hr" : run.status === "accountant_approved" ? "accountant" : "admin", action: "approved", comment: req.body.comment || "" });
  return sendSuccess(res, { message: "Payroll approved", data: run });
});

export const lockPayroll = asyncHandler(async (req, res) => {
  const base = await context(req);
  ensureObjectId(req.params.id, "payroll run");
  const run = await PayrollRun.findOneAndUpdate({ _id: req.params.id, schoolId: base.schoolId, academicYearId: base.academicYearId, status: "approved" }, { $set: { status: "locked" } }, { new: true });
  if (!run) throw new ApiError(400, "Only approved payroll can be locked");
  await ApprovalLog.create({ ...base, payrollRunId: run._id, level: "admin", action: "locked", comment: req.body.comment || "" });
  return sendSuccess(res, { message: "Payroll locked", data: run });
});

export const payrollSummaryReport = asyncHandler(async (req, res) => {
  const base = await context(req);
  const match = { schoolId: new mongoose.Types.ObjectId(base.schoolId), academicYearId: new mongoose.Types.ObjectId(base.academicYearId) };
  const [runSummary] = await PayrollRun.aggregate([{ $match: match }, { $group: { _id: null, totalRuns: { $sum: 1 }, totalPayout: { $sum: "$totalPayout" }, employeesProcessed: { $sum: "$totalEmployees" }, pendingApprovals: { $sum: { $cond: [{ $in: ["$status", ["draft", "hr_approved", "accountant_approved"]] }, 1, 0] } }, lockedRuns: { $sum: { $cond: [{ $eq: ["$status", "locked"] }, 1, 0] } } } }]);
  const loanSummary = await LoanAdvance.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 }, remaining: { $sum: "$remainingAmount" } } }]);
  const activeTaxConfig = await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true }).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, {
    message: "Payroll summary report",
    data: {
      totalRuns: 0,
      totalPayout: 0,
      employeesProcessed: 0,
      pendingApprovals: 0,
      lockedRuns: 0,
      ...(runSummary || {}),
      loanSummary,
      activeTaxConfig,
    },
  });
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
  const items = await PayrollItem.find({ payrollRunId: run._id })
    .populate({ path: "employeeId", select: "designation department userId", populate: { path: "userId", select: "name email regId" } })
    .sort({ netSalary: -1 })
    .lean();
  const approvals = await ApprovalLog.find({ payrollRunId: run._id }).populate("createdBy", "name email").sort({ createdAt: 1 }).lean();
  return sendSuccess(res, { message: "Payroll run details fetched", data: { run, items, approvals } });
});

export const getEmployeeLoans = asyncHandler(async (req, res) => {
  const base = await context(req);
  const filter = { schoolId: base.schoolId, academicYearId: base.academicYearId };
  if (req.query.status) filter.status = req.query.status;
  const loans = await populateLoan(LoanAdvance.find(filter).sort({ createdAt: -1 })).lean();
  return sendSuccess(res, { message: "Loans fetched", data: loans });
});

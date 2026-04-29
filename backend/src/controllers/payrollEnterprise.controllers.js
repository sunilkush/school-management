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
import { computeSalary } from "../services/enterprisePayroll.service.js";

const context = (req) => ({ schoolId: req.user.schoolId, academicYearId: req.user.academicYearId, createdBy: req.user._id });

export const createTaxConfiguration = asyncHandler(async (req, res) => {
  const base = context(req);
  await TaxConfiguration.updateMany({ schoolId: base.schoolId, academicYearId: base.academicYearId }, { $set: { isActive: false } });
  const doc = await TaxConfiguration.create({ ...base, ...req.body, isActive: true });
  return sendSuccess(res, { statusCode: 201, message: "Tax configuration saved", data: doc });
});

export const createLoanRequest = asyncHandler(async (req, res) => {
  const base = context(req);
  const doc = await LoanAdvance.create({ ...base, ...req.body, remainingAmount: req.body.totalAmount, history: [{ action: "created", actedBy: req.user._id, amount: req.body.totalAmount }] });
  return sendSuccess(res, { statusCode: 201, message: "Loan request created", data: doc });
});

export const approveLoan = asyncHandler(async (req, res) => {
  const loan = await LoanAdvance.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!loan) throw new ApiError(404, "Loan request not found");
  loan.status = "active"; loan.history.push({ action: "approved", actedBy: req.user._id }); await loan.save();
  return sendSuccess(res, { message: "Loan approved", data: loan });
});

export const generatePayrollRun = asyncHandler(async (req, res) => {
  const base = context(req); const { month, year } = req.body;
  const run = await PayrollRun.create({ ...base, month, year });
  const taxConfig = await TaxConfiguration.findOne({ schoolId: base.schoolId, academicYearId: base.academicYearId, isActive: true }).lean();
  const employees = await Employee.find({ schoolId: base.schoolId, isActive: true }).select("_id").lean();
  const items = [];
  for (const employee of employees) {
    const structure = await PayrollStructure.findOne({ schoolId: base.schoolId, employeeId: employee._id, status: "active" }).lean();
    if (!structure) continue;
    const loan = await LoanAdvance.findOne({ schoolId: base.schoolId, employeeId: employee._id, status: "active" }).lean();
    const salary = computeSalary({ structure, taxConfig, loanEmi: loan?.emiAmount || 0, attendance: { workingDays: 30, lopDays: 0 } });
    items.push({ ...base, payrollRunId: run._id, employeeId: employee._id, gross: salary.gross, deductions: salary.deductions, earnings: salary.earnings, totalDeductions: salary.totalDeductions, netSalary: salary.netSalary });
  }
  if (items.length) await PayrollItem.insertMany(items);
  run.totalEmployees = items.length; run.totalPayout = items.reduce((a, b) => a + b.netSalary, 0); await run.save();
  return sendSuccess(res, { statusCode: 201, message: "Payroll run generated", data: run });
});

export const approvePayroll = asyncHandler(async (req, res) => {
  const run = await PayrollRun.findOne({ _id: req.params.id, schoolId: req.user.schoolId }); if (!run) throw new ApiError(404, "Payroll run not found");
  const nextMap = { draft: "hr_approved", hr_approved: "accountant_approved", accountant_approved: "approved" };
  if (!nextMap[run.status]) throw new ApiError(400, "Payroll cannot be approved in current status");
  run.status = nextMap[run.status]; run.approvedBy.push(req.user._id); await run.save();
  await ApprovalLog.create({ ...context(req), payrollRunId: run._id, level: run.status === "hr_approved" ? "hr" : run.status === "accountant_approved" ? "accountant" : "admin", action: "approved", comment: req.body.comment || "" });
  return sendSuccess(res, { message: "Payroll approved", data: run });
});

export const lockPayroll = asyncHandler(async (req, res) => { const run = await PayrollRun.findOneAndUpdate({ _id: req.params.id, schoolId: req.user.schoolId, status: "approved" }, { $set: { status: "locked" } }, { new: true }); if (!run) throw new ApiError(400, "Only approved payroll can be locked"); return sendSuccess(res, { message: "Payroll locked", data: run }); });

export const payrollSummaryReport = asyncHandler(async (req, res) => {
  const runs = await PayrollRun.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(req.user.schoolId), academicYearId: new mongoose.Types.ObjectId(req.user.academicYearId) } }, { $group: { _id: null, totalRuns: { $sum: 1 }, totalPayout: { $sum: "$totalPayout" }, employeesProcessed: { $sum: "$totalEmployees" } } }]);
  return sendSuccess(res, { message: "Payroll summary report", data: runs[0] || { totalRuns: 0, totalPayout: 0, employeesProcessed: 0 } });
});

export const getPayrollRuns = asyncHandler(async (req, res) => {
  const runs = await PayrollRun.find({ schoolId: req.user.schoolId, academicYearId: req.user.academicYearId }).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { message: "Payroll runs fetched", data: runs });
});

export const getEmployeeLoans = asyncHandler(async (req, res) => {
  const loans = await LoanAdvance.find({ schoolId: req.user.schoolId, academicYearId: req.user.academicYearId }).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { message: "Loans fetched", data: loans });
});

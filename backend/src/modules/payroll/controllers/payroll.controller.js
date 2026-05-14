import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Employee } from "../../../models/Employee.model.js";
import {
  EmployeeLoan,
  EmployeeSalaryStructure,
  PayrollAdjustment,
  PayrollAuditLog,
  PayrollCompliance,
  PayrollCycle,
  PayrollRun,
  PayrollRunItem,
  PayrollSetting,
  Payslip,
  SalaryComponent,
  TaxDeclaration,
} from "../models/payroll.models.js";
import { calculatePayrollForCycle } from "../services/payrollCalculation.service.js";
import { writePayrollAudit } from "../services/payrollAudit.service.js";
import { assertSameSchool, requireValidObjectId, validateScope } from "../validators/payroll.validators.js";

const send = (res, status, data, message = "Success") => res.status(status).json(new ApiResponse(status, data, message));
const actor = (req) => ({ createdBy: req.user?._id, updatedBy: req.user?._id });
const ensureUnlocked = async (cycleId, schoolId) => {
  const cycle = await PayrollCycle.findOne({ _id: cycleId, schoolId });
  if (!cycle) throw new ApiError(404, "Payroll cycle not found");
  if (cycle.status === "locked") throw new ApiError(409, "Locked payroll cycle cannot be edited");
  return cycle;
};
const scopedQuery = (req) => {
  const { schoolId, academicYearId } = validateScope(req);
  return academicYearId ? { schoolId, academicYearId } : { schoolId };
};

export const upsertPayrollSettings = asyncHandler(async (req, res) => {
  const scope = validateScope(req);
  const payload = { ...req.body, ...scope, ...actor(req) };
  const setting = await PayrollSetting.findOneAndUpdate(scope, payload, { upsert: true, new: true, runValidators: true });
  await writePayrollAudit(req, { action: "upsert", entity: "PayrollSetting", entityId: setting._id, after: setting.toObject(), remarks: "Payroll settings saved" });
  send(res, 201, setting, "Payroll settings saved");
});

export const getPayrollSettings = asyncHandler(async (req, res) => {
  send(res, 200, await PayrollSetting.findOne(scopedQuery(req)).lean());
});

export const updatePayrollSettings = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);
  const scope = validateScope(req);
  const before = await PayrollSetting.findOne({ _id: req.params.id, schoolId: scope.schoolId });
  assertSameSchool(before, scope.schoolId);
  const setting = await PayrollSetting.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
  await writePayrollAudit(req, { action: "update", entity: "PayrollSetting", entityId: setting._id, before: before.toObject(), after: setting.toObject() });
  send(res, 200, setting, "Payroll settings updated");
});

export const createSalaryComponent = asyncHandler(async (req, res) => {
  const doc = await SalaryComponent.create({ ...req.body, ...validateScope(req), ...actor(req) });
  await writePayrollAudit(req, { action: "create", entity: "SalaryComponent", entityId: doc._id, after: doc.toObject() });
  send(res, 201, doc, "Salary component created");
});
export const listSalaryComponents = asyncHandler(async (req, res) => send(res, 200, await SalaryComponent.find(scopedQuery(req)).sort({ type: 1, name: 1 }).lean()));
export const updateSalaryComponent = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);
  const scope = validateScope(req);
  const before = await SalaryComponent.findOne({ _id: req.params.id, schoolId: scope.schoolId });
  assertSameSchool(before, scope.schoolId);
  const doc = await SalaryComponent.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
  await writePayrollAudit(req, { action: "update", entity: "SalaryComponent", entityId: doc._id, before: before.toObject(), after: doc.toObject() });
  send(res, 200, doc, "Salary component updated");
});
export const deleteSalaryComponent = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);
  const scope = validateScope(req);
  const doc = await SalaryComponent.findOneAndUpdate({ _id: req.params.id, schoolId: scope.schoolId }, { status: "inactive", updatedBy: req.user?._id }, { new: true });
  assertSameSchool(doc, scope.schoolId);
  await writePayrollAudit(req, { action: "deactivate", entity: "SalaryComponent", entityId: doc._id, after: doc.toObject() });
  send(res, 200, doc, "Salary component deactivated");
});

const computeStructureTotals = (body) => {
  const sum = (rows = []) => rows.reduce((t, r) => t + Number(r.amount ?? r.value ?? 0), 0);
  const grossMonthly = Number(body.grossMonthly ?? sum(body.earnings));
  const totalDeductions = Number(body.totalDeductions ?? sum(body.deductions));
  const employerContribution = Number(body.employerContribution ?? sum(body.employerContributions));
  const netMonthly = grossMonthly - totalDeductions;
  const ctcMonthly = grossMonthly + employerContribution;
  return { grossMonthly, totalDeductions, employerContribution, netMonthly, ctcMonthly, ctcYearly: ctcMonthly * 12 };
};
export const createSalaryStructure = asyncHandler(async (req, res) => {
  requireValidObjectId(req.body.employeeId, "employeeId");
  const doc = await EmployeeSalaryStructure.create({ ...req.body, ...validateScope(req), ...computeStructureTotals(req.body), status: req.body.status || "draft", ...actor(req) });
  await writePayrollAudit(req, { action: "create", entity: "EmployeeSalaryStructure", entityId: doc._id, employeeId: doc.employeeId, after: doc.toObject() });
  send(res, 201, doc, "Salary structure created");
});
export const listSalaryStructures = asyncHandler(async (req, res) => send(res, 200, await EmployeeSalaryStructure.find(scopedQuery(req)).populate("employeeId", "employeeCode department designation").sort({ updatedAt: -1 }).lean()));
export const getEmployeeSalaryStructure = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.employeeId, "employeeId");
  send(res, 200, await EmployeeSalaryStructure.find({ ...scopedQuery(req), employeeId: req.params.employeeId }).sort({ effectiveFrom: -1 }).lean());
});
export const updateSalaryStructure = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);
  const scope = validateScope(req);
  const before = await EmployeeSalaryStructure.findOne({ _id: req.params.id, schoolId: scope.schoolId });
  assertSameSchool(before, scope.schoolId);
  if (before.status === "approved") throw new ApiError(409, "Approved salary structure must be revised instead of edited");
  const doc = await EmployeeSalaryStructure.findByIdAndUpdate(req.params.id, { ...req.body, ...computeStructureTotals({ ...before.toObject(), ...req.body }), updatedBy: req.user?._id }, { new: true, runValidators: true });
  await writePayrollAudit(req, { action: "update", entity: "EmployeeSalaryStructure", entityId: doc._id, employeeId: doc.employeeId, before: before.toObject(), after: doc.toObject() });
  send(res, 200, doc, "Salary structure updated");
});
export const approveSalaryStructure = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);
  const scope = validateScope(req);
  const doc = await EmployeeSalaryStructure.findOne({ _id: req.params.id, schoolId: scope.schoolId });
  assertSameSchool(doc, scope.schoolId);
  doc.status = "approved"; doc.approvedBy = req.user?._id; doc.approvedAt = new Date(); doc.updatedBy = req.user?._id;
  doc.approvalTrail.push({ action: "approve", status: "approved", comment: req.body?.comment, performedBy: req.user?._id, role: req.userRole?.name });
  await doc.save();
  await writePayrollAudit(req, { action: "approve", entity: "EmployeeSalaryStructure", entityId: doc._id, employeeId: doc.employeeId, after: doc.toObject() });
  send(res, 200, doc, "Salary structure approved");
});

export const createPayrollCycle = asyncHandler(async (req, res) => {
  const doc = await PayrollCycle.create({ ...req.body, ...validateScope(req), status: "draft", ...actor(req) });
  await writePayrollAudit(req, { action: "create", entity: "PayrollCycle", entityId: doc._id, after: doc.toObject() });
  send(res, 201, doc, "Payroll cycle created");
});
export const listPayrollCycles = asyncHandler(async (req, res) => send(res, 200, await PayrollCycle.find(scopedQuery(req)).sort({ year: -1, month: -1 }).lean()));
export const getPayrollCycle = asyncHandler(async (req, res) => { requireValidObjectId(req.params.id); const doc = await PayrollCycle.findOne({ _id: req.params.id, ...scopedQuery(req) }).lean(); if (!doc) throw new ApiError(404, "Payroll cycle not found"); send(res, 200, doc); });
export const updatePayrollCycle = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id); const scope = validateScope(req); const cycle = await ensureUnlocked(req.params.id, scope.schoolId);
  if (cycle.status !== "draft") throw new ApiError(409, "Only draft payroll cycles can be edited");
  const doc = await PayrollCycle.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
  await writePayrollAudit(req, { action: "update", entity: "PayrollCycle", entityId: doc._id, before: cycle.toObject(), after: doc.toObject() });
  send(res, 200, doc, "Payroll cycle updated");
});
export const lockPayrollCycle = asyncHandler(async (req, res) => { requireValidObjectId(req.params.id); const scope = validateScope(req); const cycle = await PayrollCycle.findOne({ _id: req.params.id, schoolId: scope.schoolId }); assertSameSchool(cycle, scope.schoolId); if (cycle.status !== "paid") throw new ApiError(409, "Only paid payroll cycles can be locked"); cycle.status = "locked"; cycle.lockedAt = new Date(); cycle.lockedBy = req.user?._id; cycle.updatedBy = req.user?._id; await cycle.save(); await writePayrollAudit(req, { action: "lock", entity: "PayrollCycle", entityId: cycle._id, after: cycle.toObject() }); send(res, 200, cycle, "Payroll cycle locked"); });

export const calculatePayrollRun = asyncHandler(async (req, res) => { requireValidObjectId(req.params.cycleId, "cycleId"); const scope = validateScope(req); const cycle = await ensureUnlocked(req.params.cycleId, scope.schoolId); const result = await calculatePayrollForCycle({ cycle, req }); await writePayrollAudit(req, { action: "calculate", entity: "PayrollRun", entityId: result.run._id, after: result.run.toObject() }); send(res, 200, result, "Payroll calculated"); });
export const listPayrollRunItems = asyncHandler(async (req, res) => { requireValidObjectId(req.params.cycleId, "cycleId"); send(res, 200, await PayrollRunItem.find({ ...scopedQuery(req), cycleId: req.params.cycleId }).populate("employeeId", "employeeCode department designation").lean()); });
export const updatePayrollRunItem = asyncHandler(async (req, res) => { requireValidObjectId(req.params.itemId, "itemId"); const scope = validateScope(req); const item = await PayrollRunItem.findOne({ _id: req.params.itemId, schoolId: scope.schoolId }); assertSameSchool(item, scope.schoolId); await ensureUnlocked(item.cycleId, scope.schoolId); Object.assign(item, req.body, { updatedBy: req.user?._id }); await item.save(); await writePayrollAudit(req, { action: "update", entity: "PayrollRunItem", entityId: item._id, employeeId: item.employeeId, after: item.toObject() }); send(res, 200, item, "Payroll item updated"); });
export const approvePayrollRun = asyncHandler(async (req, res) => { requireValidObjectId(req.params.cycleId, "cycleId"); const scope = validateScope(req); const cycle = await ensureUnlocked(req.params.cycleId, scope.schoolId); const run = await PayrollRun.findOne({ schoolId: scope.schoolId, cycleId: cycle._id }); if (!run) throw new ApiError(404, "Payroll run not found"); run.status = "approved"; run.approvedBy = req.user?._id; run.approvedAt = new Date(); run.approvalTrail.push({ action: "approve", status: "approved", comment: req.body?.comment, performedBy: req.user?._id, role: req.userRole?.name }); await run.save(); cycle.status = "approved"; await cycle.save(); await PayrollRunItem.updateMany({ cycleId: cycle._id, schoolId: scope.schoolId }, { status: "approved" }); await writePayrollAudit(req, { action: "approve", entity: "PayrollRun", entityId: run._id, after: run.toObject() }); send(res, 200, run, "Payroll approved"); });
export const markPayrollPaid = asyncHandler(async (req, res) => { requireValidObjectId(req.params.cycleId, "cycleId"); const scope = validateScope(req); const cycle = await ensureUnlocked(req.params.cycleId, scope.schoolId); const run = await PayrollRun.findOne({ schoolId: scope.schoolId, cycleId: cycle._id }); if (!run || run.status !== "approved") throw new ApiError(409, "Payroll must be approved before marking paid"); run.status = "paid"; run.paidBy = req.user?._id; run.paidAt = new Date(); await run.save(); cycle.status = "paid"; await cycle.save(); await PayrollRunItem.updateMany({ cycleId: cycle._id, schoolId: scope.schoolId }, { status: "paid", paymentStatus: "paid" }); await Payslip.updateMany({ cycleId: cycle._id, schoolId: scope.schoolId }, { paymentStatus: "paid" }); await writePayrollAudit(req, { action: "mark_paid", entity: "PayrollRun", entityId: run._id, after: run.toObject() }); send(res, 200, run, "Payroll marked as paid"); });

export const generatePayslips = asyncHandler(async (req, res) => { requireValidObjectId(req.params.cycleId, "cycleId"); const scope = validateScope(req); const cycle = await PayrollCycle.findOne({ _id: req.params.cycleId, schoolId: scope.schoolId }); assertSameSchool(cycle, scope.schoolId); const items = await PayrollRunItem.find({ schoolId: scope.schoolId, cycleId: cycle._id }).lean(); const docs = []; for (const item of items) { docs.push(await Payslip.findOneAndUpdate({ schoolId: scope.schoolId, cycleId: cycle._id, employeeId: item.employeeId }, { ...scope, cycleId: cycle._id, payrollRunItemId: item._id, employeeId: item.employeeId, payslipNumber: `PS-${cycle.year}${String(cycle.month).padStart(2, "0")}-${String(item.employeeId).slice(-6)}`, month: cycle.month, year: cycle.year, grossPay: item.grossPay, deductions: item.totalDeductions, employerContribution: item.employerContribution, netPay: item.netPay, payload: item, status: "generated", ...actor(req) }, { upsert: true, new: true, runValidators: true })); } await writePayrollAudit(req, { action: "generate", entity: "Payslip", entityId: cycle._id, remarks: `${docs.length} payslips generated`, after: { schoolId: scope.schoolId, academicYearId: scope.academicYearId } }); send(res, 201, docs, "Payslips generated"); });
export const publishPayslips = asyncHandler(async (req, res) => { requireValidObjectId(req.params.cycleId, "cycleId"); const scope = validateScope(req); const result = await Payslip.updateMany({ schoolId: scope.schoolId, cycleId: req.params.cycleId }, { status: "published", publishedAt: new Date(), publishedBy: req.user?._id, updatedBy: req.user?._id }); await writePayrollAudit(req, { action: "publish", entity: "Payslip", entityId: req.params.cycleId, remarks: `${result.modifiedCount} payslips published`, after: { schoolId: scope.schoolId, academicYearId: scope.academicYearId } }); send(res, 200, result, "Payslips published"); });
export const listPayslips = asyncHandler(async (req, res) => send(res, 200, await Payslip.find(scopedQuery(req)).populate("employeeId", "employeeCode department designation").sort({ year: -1, month: -1 }).lean()));
export const listMyPayslips = asyncHandler(async (req, res) => { const scope = validateScope(req); const employee = await Employee.findOne({ schoolId: scope.schoolId, userId: req.user?._id }).lean(); if (!employee) return send(res, 200, []); send(res, 200, await Payslip.find({ schoolId: scope.schoolId, employeeId: employee._id, status: "published" }).sort({ year: -1, month: -1 }).lean()); });
export const downloadPayslip = asyncHandler(async (req, res) => { requireValidObjectId(req.params.id); const doc = await Payslip.findOne({ _id: req.params.id, ...scopedQuery(req) }).lean(); if (!doc) throw new ApiError(404, "Payslip not found"); send(res, 200, { ...doc, downloadUrl: `/api/v1/payroll/payslips/${doc._id}/download` }, "Payslip download payload"); });

export const listEmployeeLoans = asyncHandler(async (req, res) => send(res, 200, await EmployeeLoan.find(scopedQuery(req)).sort({ createdAt: -1 }).lean()));
export const createEmployeeLoan = asyncHandler(async (req, res) => { const doc = await EmployeeLoan.create({ ...req.body, ...validateScope(req), status: req.body.status || "pending", balance: req.body.approvedAmount || req.body.principalAmount, ...actor(req) }); await writePayrollAudit(req, { action: "create", entity: "EmployeeLoan", entityId: doc._id, employeeId: doc.employeeId, after: doc.toObject() }); send(res, 201, doc, "Loan request saved"); });
export const listTaxDeclarations = asyncHandler(async (req, res) => send(res, 200, await TaxDeclaration.find(scopedQuery(req)).sort({ updatedAt: -1 }).lean()));
export const upsertTaxDeclaration = asyncHandler(async (req, res) => { const scope = validateScope(req); const doc = await TaxDeclaration.findOneAndUpdate({ schoolId: scope.schoolId, employeeId: req.body.employeeId, financialYear: req.body.financialYear }, { ...req.body, ...scope, ...actor(req) }, { upsert: true, new: true, runValidators: true }); await writePayrollAudit(req, { action: "upsert", entity: "TaxDeclaration", entityId: doc._id, employeeId: doc.employeeId, after: doc.toObject() }); send(res, 201, doc, "Tax declaration saved"); });

export const payrollSummaryReport = asyncHandler(async (req, res) => { const scope = scopedQuery(req); const cycles = await PayrollCycle.find(scope).sort({ year: -1, month: -1 }).lean(); const totals = cycles.reduce((a, c) => ({ grossPay: a.grossPay + (c.grossPay || 0), deductions: a.deductions + (c.deductions || 0), netPay: a.netPay + (c.netPay || 0), employerContribution: a.employerContribution + (c.employerContribution || 0) }), { grossPay: 0, deductions: 0, netPay: 0, employerContribution: 0 }); send(res, 200, { cards: totals, cycles }); });
export const departmentCostReport = asyncHandler(async (req, res) => { const items = await PayrollRunItem.find(scopedQuery(req)).lean(); const rows = Object.values(items.reduce((acc, item) => { const dept = item.employeeSnapshot?.department || "Unassigned"; acc[dept] ||= { department: dept, employees: 0, grossPay: 0, deductions: 0, netPay: 0 }; acc[dept].employees += 1; acc[dept].grossPay += item.grossPay || 0; acc[dept].deductions += item.totalDeductions || 0; acc[dept].netPay += item.netPay || 0; return acc; }, {})); send(res, 200, rows); });
export const statutoryReport = asyncHandler(async (req, res) => send(res, 200, await PayrollCompliance.find(scopedQuery(req)).sort({ dueDate: -1 }).lean()));
export const bankExportReport = asyncHandler(async (req, res) => send(res, 200, await PayrollRunItem.find({ ...scopedQuery(req), paymentStatus: { $in: ["pending", "paid"] } }).select("employeeSnapshot netPay paymentStatus").lean()));
export const employeeLedgerReport = asyncHandler(async (req, res) => { requireValidObjectId(req.params.employeeId, "employeeId"); send(res, 200, { payslips: await Payslip.find({ ...scopedQuery(req), employeeId: req.params.employeeId }).lean(), loans: await EmployeeLoan.find({ ...scopedQuery(req), employeeId: req.params.employeeId }).lean(), adjustments: await PayrollAdjustment.find({ ...scopedQuery(req), employeeId: req.params.employeeId }).lean() }); });
export const auditLogs = asyncHandler(async (req, res) => send(res, 200, await PayrollAuditLog.find(scopedQuery(req)).sort({ createdAt: -1 }).limit(200).lean()));

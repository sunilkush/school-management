import mongoose from "mongoose";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Employee } from "../models/Employee.model.js";
import { User } from "../models/user.model.js";
import {
  EmployeeLoan,
  EmployeePayrollProfile,
  PayrollAdjustment,
  PayrollCycle,
  PayrollRunItem,
  PayrollSetting,
  PayrollStructure,
  Reimbursement,
  SalaryComponent,
} from "../models/payroll.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ADMIN_ROLES = ["Super Admin", "School Admin", "Principal", "Accountant", "HR"];
const BLOCKED_ROLES = ["Parent", "Student"];
const LOCKED_MESSAGE = "Locked payroll cycles cannot be edited";

const roleName = (req) => req.userRole?.name || req.user?.roleId?.name || req.user?.role?.name || req.user?.role;
const isSuperAdmin = (req) => roleName(req) === "Super Admin";
const oid = (value) => (value ? new mongoose.Types.ObjectId(value) : value);
const asPlainId = (value) => value?._id?.toString?.() || value?.toString?.();

const assertPayrollAccess = (req, adminOnly = false) => {
  const role = roleName(req);
  if (BLOCKED_ROLES.includes(role)) throw new ApiError(403, "Parents and students cannot access payroll");
  if (adminOnly && !ADMIN_ROLES.includes(role)) throw new ApiError(403, "Forbidden. Payroll admin access required.");
};

const resolveSchoolId = (req, source = {}) => {
  if (isSuperAdmin(req)) return source.schoolId || req.query.schoolId || req.body.schoolId;
  return asPlainId(req.user.schoolId);
};

const resolveAcademicYearId = async (req, source = {}) => {
  const explicit = source.academicYearId || req.query.academicYearId || req.body.academicYearId;
  if (explicit) return explicit;
  const schoolId = resolveSchoolId(req, source);
  if (!schoolId) return undefined;
  const activeYear = await AcademicYear.findOne({ schoolId, isActive: true }).select("_id").lean();
  return activeYear?._id;
};

const requireScope = async (req, source = {}, academicRequired = true) => {
  const schoolId = resolveSchoolId(req, source);
  if (!schoolId) throw new ApiError(400, "schoolId is required");
  const academicYearId = await resolveAcademicYearId(req, { ...source, schoolId });
  if (academicRequired && !academicYearId) throw new ApiError(400, "academicYearId is required");
  return { schoolId, academicYearId };
};

const ensureSameSchool = (req, doc) => {
  if (!doc) throw new ApiError(404, "Payroll record not found");
  if (!isSuperAdmin(req) && asPlainId(doc.schoolId) !== asPlainId(req.user.schoolId)) {
    throw new ApiError(403, "You cannot access another school's payroll data");
  }
};

const rejectIfLocked = (cycle) => {
  if (cycle?.status === "locked") throw new ApiError(423, LOCKED_MESSAGE);
};

const sum = (arr = [], key = "amount") => arr.reduce((total, item) => total + Number(item?.[key] || 0), 0);
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const monthDates = (month, year) => ({ start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)) });

const attendanceSummaryFor = async ({ schoolId, employeeId, startDate, endDate }) => {
  const records = await Attendance.find({ schoolId, userId: employeeId, date: { $gte: startDate, $lte: endDate } }).select("status").lean();
  const workingDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);
  const presentDays = records.filter((r) => ["present", "late"].includes(r.status)).length;
  const paidLeaves = records.filter((r) => ["leave", "halfday"].includes(r.status)).length;
  const absentDays = records.filter((r) => r.status === "absent").length;
  return { workingDays, presentDays, paidLeaves, unpaidLeaves: Math.max(0, absentDays), absentDays, overtimeHours: 0 };
};

const calculateRunItem = async ({ cycle, employeeId, setting }) => {
  const structure = await PayrollStructure.findOne({
    schoolId: cycle.schoolId,
    academicYearId: cycle.academicYearId,
    employeeId,
    status: "active",
    effectiveFrom: { $lte: cycle.endDate || new Date(cycle.year, cycle.month, 0) },
    $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gte: cycle.startDate || new Date(cycle.year, cycle.month - 1, 1) } }],
  }).sort({ effectiveFrom: -1 }).lean();

  if (!structure) return null;

  const attendanceSummary = await attendanceSummaryFor({ schoolId: cycle.schoolId, employeeId, startDate: cycle.startDate, endDate: cycle.endDate });
  const payableRatio = setting?.salaryCalculationType === "attendance_based"
    ? Math.min(1, (attendanceSummary.presentDays + attendanceSummary.paidLeaves) / Math.max(1, attendanceSummary.workingDays))
    : 1;

  const scaleLine = (line) => ({ name: line.name, componentId: line.componentId, amount: roundMoney(Number(line.amount || 0) * payableRatio) });
  const earnings = (structure.earnings || []).map(scaleLine);
  const deductions = (structure.deductions || []).map(scaleLine);
  const employerContributions = [];

  const adjustments = await PayrollAdjustment.find({ schoolId: cycle.schoolId, payrollCycleId: cycle._id, employeeId, status: "approved" }).lean();
  adjustments.forEach((adjustment) => {
    const line = { name: adjustment.title, amount: roundMoney(adjustment.amount) };
    if (adjustment.type === "earning") earnings.push(line);
    else deductions.push(line);
  });

  const loan = await EmployeeLoan.findOne({ schoolId: cycle.schoolId, employeeId, status: "active", remainingAmount: { $gt: 0 } }).sort({ startMonth: 1 });
  if (loan) {
    const loanDeduction = roundMoney(Math.min(Number(loan.monthlyDeduction || 0), Number(loan.remainingAmount || 0)));
    if (loanDeduction > 0) deductions.push({ name: "Loan EMI", amount: loanDeduction });
  }

  const grossSalary = roundMoney(sum(earnings));
  const totalDeductions = roundMoney(sum(deductions));
  const netSalary = roundMoney(Math.max(0, grossSalary - totalDeductions));

  return { attendanceSummary, earnings, deductions, employerContributions, grossSalary, totalDeductions, netSalary };
};

const refreshCycleTotals = async (cycleId) => {
  const totals = await PayrollRunItem.aggregate([
    { $match: { payrollCycleId: oid(cycleId) } },
    { $group: { _id: "$payrollCycleId", totalEmployees: { $sum: 1 }, grossAmount: { $sum: "$grossSalary" }, deductionAmount: { $sum: "$totalDeductions" }, netPayable: { $sum: "$netSalary" } } },
  ]);
  const total = totals[0] || { totalEmployees: 0, grossAmount: 0, deductionAmount: 0, netPayable: 0 };
  return PayrollCycle.findByIdAndUpdate(cycleId, { $set: total }, { new: true });
};

export const getSettings = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req);
  const setting = await PayrollSetting.findOne({ schoolId, academicYearId }).lean();
  res.json(new ApiResponse(200, setting, "Payroll settings fetched"));
});

export const upsertSettings = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req);
  const setting = await PayrollSetting.findOneAndUpdate(
    { schoolId, academicYearId },
    {
      $set: { ...req.body, schoolId, academicYearId, updatedBy: req.user._id },
      $setOnInsert: { createdBy: req.user._id },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(new ApiResponse(201, setting, "Payroll settings saved"));
});

export const updateSettings = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const setting = await PayrollSetting.findById(req.params.id);
  ensureSameSchool(req, setting);
  Object.assign(setting, req.body, { updatedBy: req.user._id });
  await setting.save();
  res.json(new ApiResponse(200, setting, "Payroll settings updated"));
});

export const listComponents = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId } = await requireScope(req, {}, false);
  const filter = { schoolId };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) filter.$or = [{ name: new RegExp(req.query.search, "i") }, { code: new RegExp(req.query.search, "i") }];
  const data = await SalaryComponent.find(filter).sort({ type: 1, name: 1 }).lean();
  res.json(new ApiResponse(200, data, "Salary components fetched"));
});

export const createComponent = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId } = await requireScope(req, req.body, false);
  try {
    const component = await SalaryComponent.create({ ...req.body, schoolId, createdBy: req.user._id });
    res.status(201).json(new ApiResponse(201, component, "Salary component created"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "Salary component code already exists for this school");
    throw error;
  }
});

export const updateComponent = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const component = await SalaryComponent.findById(req.params.id);
  ensureSameSchool(req, component);
  Object.assign(component, req.body);
  await component.save();
  res.json(new ApiResponse(200, component, "Salary component updated"));
});

export const deleteComponent = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const component = await SalaryComponent.findById(req.params.id);
  ensureSameSchool(req, component);
  await component.deleteOne();
  res.json(new ApiResponse(200, null, "Salary component deleted"));
});

export const listEmployees = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId } = await requireScope(req, {}, false);
  const users = await User.find({ schoolId, isDeleted: { $ne: true } }).select("name email phone roleId schoolId").populate("roleId", "name").lean();
  const ids = users.map((u) => u._id);
  const profiles = await EmployeePayrollProfile.find({ schoolId, userId: { $in: ids } }).lean();
  const structures = await PayrollStructure.find({ schoolId, employeeId: { $in: ids }, status: "active" }).select("employeeId status").lean();
  const profileByUser = new Map(profiles.map((p) => [asPlainId(p.userId), p]));
  const structureSet = new Set(structures.map((s) => asPlainId(s.employeeId)));
  res.json(new ApiResponse(200, users.map((user) => ({
    ...user,
    payrollProfile: profileByUser.get(asPlainId(user._id)) || null,
    salaryStatus: profileByUser.get(asPlainId(user._id))?.salaryStatus || "not_configured",
    bankProfileComplete: Boolean(profileByUser.get(asPlainId(user._id))?.bankDetails?.accountNumber),
    salaryStructureActive: structureSet.has(asPlainId(user._id)),
  })), "Payroll employees fetched"));
});

export const getEmployeePayroll = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId;
  const isSelf = asPlainId(req.user._id) === employeeId;
  if (!isSelf) assertPayrollAccess(req, true);
  const { schoolId } = await requireScope(req, {}, false);
  if (!isSelf && !isSuperAdmin(req)) {
    const user = await User.findOne({ _id: employeeId, schoolId }).select("_id").lean();
    if (!user) throw new ApiError(404, "Employee not found in this school");
  }
  const [profile, structures, loans, reimbursements] = await Promise.all([
    EmployeePayrollProfile.findOne({ schoolId, userId: employeeId }).lean(),
    PayrollStructure.find({ schoolId, employeeId }).sort({ effectiveFrom: -1 }).lean(),
    EmployeeLoan.find({ schoolId, employeeId }).sort({ createdAt: -1 }).lean(),
    Reimbursement.find({ schoolId, employeeId }).sort({ createdAt: -1 }).lean(),
  ]);
  res.json(new ApiResponse(200, { profile, structures, loans, reimbursements }, "Employee payroll fetched"));
});

export const saveEmployeeProfile = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const employeeId = req.params.employeeId;
  const { schoolId } = await requireScope(req, req.body, false);
  const user = await User.findOne({ _id: employeeId, schoolId }).select("_id roleId").lean();
  if (!user) throw new ApiError(404, "Employee not found in this school");
  const employee = await Employee.findOne({ schoolId, userId: employeeId }).select("_id designation joinDate").lean();
  const profile = await EmployeePayrollProfile.findOneAndUpdate(
    { schoolId, userId: employeeId },
    { ...req.body, schoolId, userId: employeeId, employeeId: employee?._id || employeeId, employeeRefModel: employee?._id ? "Employee" : "User", roleId: user.roleId },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(new ApiResponse(201, profile, "Employee payroll profile saved"));
});

export const listStructures = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req);
  const filter = { schoolId, academicYearId };
  if (req.query.employeeId) filter.employeeId = req.query.employeeId;
  const data = await PayrollStructure.find(filter).populate("employeeId", "name email").sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, data, "Payroll structures fetched"));
});

export const createStructure = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req, req.body);
  const grossMonthly = roundMoney(sum(req.body.earnings));
  const deductions = roundMoney(sum(req.body.deductions));
  const structure = await PayrollStructure.create({ ...req.body, schoolId, academicYearId, grossMonthly, netMonthly: roundMoney(grossMonthly - deductions), ctcMonthly: req.body.ctcMonthly || grossMonthly, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, structure, "Payroll structure created"));
});

export const updateStructure = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const structure = await PayrollStructure.findById(req.params.id);
  ensureSameSchool(req, structure);
  const activeCycle = await PayrollCycle.findOne({ schoolId: structure.schoolId, academicYearId: structure.academicYearId, status: "locked" }).lean();
  if (activeCycle) rejectIfLocked(activeCycle);
  Object.assign(structure, req.body);
  structure.grossMonthly = roundMoney(sum(structure.earnings));
  structure.netMonthly = roundMoney(structure.grossMonthly - sum(structure.deductions));
  await structure.save();
  res.json(new ApiResponse(200, structure, "Payroll structure updated"));
});

export const activateStructure = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const structure = await PayrollStructure.findById(req.params.id);
  ensureSameSchool(req, structure);
  await PayrollStructure.updateMany({ schoolId: structure.schoolId, academicYearId: structure.academicYearId, employeeId: structure.employeeId, _id: { $ne: structure._id } }, { $set: { status: "archived" } });
  structure.status = "active";
  await structure.save();
  res.json(new ApiResponse(200, structure, "Payroll structure activated"));
});

export const listCycles = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req);
  const filter = { schoolId, academicYearId };
  if (req.query.status) filter.status = req.query.status;
  const data = await PayrollCycle.find(filter).sort({ year: -1, month: -1 }).lean();
  res.json(new ApiResponse(200, data, "Payroll cycles fetched"));
});

export const createCycle = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req, req.body);
  const { start, end } = monthDates(Number(req.body.month), Number(req.body.year));
  try {
    const cycle = await PayrollCycle.create({ ...req.body, schoolId, academicYearId, startDate: req.body.startDate || start, endDate: req.body.endDate || end, name: req.body.name || `${req.body.month}/${req.body.year} Payroll`, createdBy: req.user._id });
    res.status(201).json(new ApiResponse(201, cycle, "Payroll cycle created"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "Payroll cycle already exists for this school, academic year, month and year");
    throw error;
  }
});

export const getCycle = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const cycle = await PayrollCycle.findById(req.params.id).lean();
  ensureSameSchool(req, cycle);
  const items = await PayrollRunItem.find({ payrollCycleId: req.params.id, schoolId: cycle.schoolId }).populate("employeeId", "name email").lean();
  res.json(new ApiResponse(200, { cycle, items }, "Payroll cycle fetched"));
});

export const processCycle = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const cycle = await PayrollCycle.findById(req.params.id);
  ensureSameSchool(req, cycle);
  rejectIfLocked(cycle);
  cycle.status = "processing";
  await cycle.save();
  const setting = await PayrollSetting.findOne({ schoolId: cycle.schoolId, academicYearId: cycle.academicYearId }).lean();
  const profiles = await EmployeePayrollProfile.find({ schoolId: cycle.schoolId, salaryStatus: "active" }).select("userId").lean();
  const employees = profiles.length ? profiles.map((profile) => profile.userId) : (await PayrollStructure.distinct("employeeId", { schoolId: cycle.schoolId, academicYearId: cycle.academicYearId, status: "active" }));
  let processed = 0;
  for (const employeeId of employees) {
    const calculated = await calculateRunItem({ cycle, employeeId, setting });
    if (!calculated) continue;
    await PayrollRunItem.findOneAndUpdate(
      { payrollCycleId: cycle._id, employeeId },
      { ...calculated, schoolId: cycle.schoolId, academicYearId: cycle.academicYearId, payrollCycleId: cycle._id, employeeId, userId: employeeId, paymentStatus: "pending" },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    processed += 1;
  }
  const updated = await refreshCycleTotals(cycle._id);
  updated.status = setting?.payrollApprovalRequired === false ? "approved" : "pending_approval";
  await updated.save();
  res.json(new ApiResponse(200, { cycle: updated, processed }, "Payroll cycle processed"));
});

const transitionCycle = (status, extra = {}) => asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const cycle = await PayrollCycle.findById(req.params.id);
  ensureSameSchool(req, cycle);
  rejectIfLocked(cycle);
  Object.assign(cycle, extra(req), { status });
  await cycle.save();
  res.json(new ApiResponse(200, cycle, `Payroll cycle ${status.replace("_", " ")}`));
});

export const approveCycle = transitionCycle("approved", (req) => ({ approvedBy: req.user._id, approvedAt: new Date() }));
export const rejectCycle = transitionCycle("draft", () => ({}));
export const markCyclePaid = transitionCycle("paid", () => ({}));
export const lockCycle = transitionCycle("locked", () => ({ lockedAt: new Date() }));

export const listPayslips = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId, academicYearId } = await requireScope(req);
  const filter = { schoolId, academicYearId };
  if (req.query.employeeId) filter.employeeId = req.query.employeeId;
  const data = await PayrollRunItem.find(filter).populate("employeeId", "name email").populate("payrollCycleId", "name month year status payDate").sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, data, "Payslips fetched"));
});

export const myPayslips = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, false);
  const { schoolId, academicYearId } = await requireScope(req);
  const data = await PayrollRunItem.find({ schoolId, academicYearId, employeeId: req.user._id }).populate("payrollCycleId", "name month year status payDate").sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, data, "My payslips fetched"));
});

export const downloadPayslip = asyncHandler(async (req, res) => {
  const item = await PayrollRunItem.findById(req.params.runItemId).populate("employeeId", "name email").populate("payrollCycleId", "name month year").lean();
  ensureSameSchool(req, item);
  if (!ADMIN_ROLES.includes(roleName(req)) && asPlainId(item.employeeId?._id || item.employeeId) !== asPlainId(req.user._id)) {
    throw new ApiError(403, "You can only download your own payslip");
  }
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename=payslip-${item._id}.txt`);
  res.send(`Payslip\nEmployee: ${item.employeeId?.name || item.employeeId}\nGross: ${item.grossSalary}\nDeductions: ${item.totalDeductions}\nNet: ${item.netSalary}\n`);
});

export const generatePayslips = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const cycle = await PayrollCycle.findById(req.params.id);
  ensureSameSchool(req, cycle);
  rejectIfLocked(cycle);
  const items = await PayrollRunItem.updateMany({ payrollCycleId: cycle._id, schoolId: cycle.schoolId }, [{ $set: { payslipUrl: { $concat: ["/api/v1/payroll/payslips/", { $toString: "$_id" }, "/download"] } } }]);
  res.json(new ApiResponse(200, { generated: items.modifiedCount }, "Payslips generated"));
});

const reportFilter = async (req) => {
  const { schoolId, academicYearId } = await requireScope(req);
  const filter = { schoolId: oid(schoolId), academicYearId: oid(academicYearId) };
  if (req.query.cycleId) filter.payrollCycleId = oid(req.query.cycleId);
  return filter;
};

export const summaryReport = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const filter = await reportFilter(req);
  const [summary] = await PayrollRunItem.aggregate([{ $match: filter }, { $group: { _id: null, employees: { $sum: 1 }, grossSalary: { $sum: "$grossSalary" }, totalDeductions: { $sum: "$totalDeductions" }, netSalary: { $sum: "$netSalary" } } }]);
  res.json(new ApiResponse(200, summary || { employees: 0, grossSalary: 0, totalDeductions: 0, netSalary: 0 }, "Payroll summary report"));
});

export const exportReport = (kind) => asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const filter = await reportFilter(req);
  const rows = await PayrollRunItem.find(filter).populate("employeeId", "name email").lean();
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${kind}-payroll-report.csv`);
    res.send(["Employee,Email,Gross,Deductions,Net", ...rows.map((r) => `${r.employeeId?.name || ""},${r.employeeId?.email || ""},${r.grossSalary},${r.totalDeductions},${r.netSalary}`)].join("\n"));
    return;
  }
  res.json(new ApiResponse(200, { kind, rows }, `${kind} payroll report`));
});

export const listLoans = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, false);
  const { schoolId } = await requireScope(req, {}, false);
  const filter = { schoolId };
  if (!ADMIN_ROLES.includes(roleName(req))) filter.employeeId = req.user._id;
  if (req.query.employeeId && ADMIN_ROLES.includes(roleName(req))) filter.employeeId = req.query.employeeId;
  const data = await EmployeeLoan.find(filter).populate("employeeId", "name email").sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, data, "Employee loans fetched"));
});

export const createLoan = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const { schoolId } = await requireScope(req, req.body, false);
  const loan = await EmployeeLoan.create({ ...req.body, schoolId, remainingAmount: req.body.remainingAmount ?? req.body.principalAmount });
  res.status(201).json(new ApiResponse(201, loan, "Employee loan saved"));
});

export const listReimbursements = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, false);
  const { schoolId } = await requireScope(req, {}, false);
  const filter = { schoolId };
  if (!ADMIN_ROLES.includes(roleName(req))) filter.employeeId = req.user._id;
  if (req.query.employeeId && ADMIN_ROLES.includes(roleName(req))) filter.employeeId = req.query.employeeId;
  const data = await Reimbursement.find(filter).populate("employeeId", "name email").sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, data, "Reimbursements fetched"));
});

export const createReimbursement = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, false);
  const { schoolId } = await requireScope(req, req.body, false);
  const employeeId = ADMIN_ROLES.includes(roleName(req)) && req.body.employeeId ? req.body.employeeId : req.user._id;
  const reimbursement = await Reimbursement.create({ ...req.body, schoolId, employeeId });
  res.status(201).json(new ApiResponse(201, reimbursement, "Reimbursement submitted"));
});

export const updateReimbursementStatus = asyncHandler(async (req, res) => {
  assertPayrollAccess(req, true);
  const reimbursement = await Reimbursement.findById(req.params.id);
  ensureSameSchool(req, reimbursement);
  reimbursement.status = req.body.status;
  reimbursement.approvedBy = req.user._id;
  await reimbursement.save();
  res.json(new ApiResponse(200, reimbursement, "Reimbursement updated"));
});

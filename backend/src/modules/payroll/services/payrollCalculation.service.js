import { Employee } from "../../../models/Employee.model.js";
import { EmployeeLoan, EmployeeSalaryStructure, PayrollAdjustment, PayrollRun, PayrollRunItem, PayrollSetting } from "../models/payroll.models.js";

const sum = (rows = [], key = "amount") => rows.reduce((total, row) => total + Number(row?.[key] || 0), 0);
const roundBy = (value, method = "nearest") => {
  if (method === "ceil") return Math.ceil(value);
  if (method === "floor") return Math.floor(value);
  if (method === "none") return Number(value.toFixed(2));
  return Math.round(value);
};

const materializeLines = (rows = [], baseAmount = 0) => rows.map((row) => {
  const amount = row.calculationType === "percentage" ? (baseAmount * Number(row.value || 0)) / 100 : Number(row.value ?? row.amount ?? 0);
  const plain = row.toObject?.() ?? row;
  return { ...plain, amount };
});

export const calculatePayrollForCycle = async ({ cycle, req }) => {
  const schoolId = cycle.schoolId;
  const academicYearId = cycle.academicYearId;
  const settings = await PayrollSetting.findOne({ schoolId, academicYearId }).lean();
  const employees = await Employee.find({ schoolId, isActive: true }).select("employeeCode department designation bankDetails userId").lean();

  const run = await PayrollRun.findOneAndUpdate(
    { schoolId, academicYearId, cycleId: cycle._id },
    { $setOnInsert: { createdBy: req.user?._id }, $set: { status: "processing", updatedBy: req.user?._id, runNumber: `PR-${cycle.year}-${String(cycle.month).padStart(2, "0")}` } },
    { upsert: true, new: true }
  );

  await PayrollRunItem.deleteMany({ schoolId, academicYearId, cycleId: cycle._id, payrollRunId: run._id });

  const workingDays = Math.max(1, Math.ceil((new Date(cycle.endDate) - new Date(cycle.startDate)) / 86400000) + 1);
  const totals = { totalEmployees: employees.length, grossPay: 0, deductions: 0, employerContribution: 0, netPay: 0, pf: 0, esi: 0, tds: 0, professionalTax: 0 };

  const items = [];
  for (const employee of employees) {
    const structure = await EmployeeSalaryStructure.findOne({ schoolId, employeeId: employee._id, status: "approved", effectiveFrom: { $lte: cycle.endDate } }).sort({ effectiveFrom: -1 });
    if (!structure) continue;

    const earnings = materializeLines(structure.earnings, structure.grossMonthly);
    const grossPay = sum(earnings);
    const unpaidLeaves = 0;
    const unpaidLeaveDeduction = (grossPay / workingDays) * unpaidLeaves;
    const statutoryDeductions = [];
    const employerContributions = materializeLines(structure.employerContributions, grossPay);

    if (settings?.pf?.enabled && structure.statutoryFlags?.pfEnabled) {
      const pfBase = Math.min(grossPay, settings.pf.wageCeiling || grossPay);
      const employeePf = (pfBase * Number(settings.pf.employeeRate || 0)) / 100;
      const employerPf = (pfBase * Number(settings.pf.employerRate || 0)) / 100;
      statutoryDeductions.push({ name: "Provident Fund", code: "PF", type: "deduction", amount: employeePf, value: employeePf, taxable: false });
      employerContributions.push({ name: "Employer PF", code: "ER_PF", type: "employer_contribution", amount: employerPf, value: employerPf, taxable: false });
      totals.pf += employeePf + employerPf;
    }
    if (settings?.esi?.enabled && structure.statutoryFlags?.esiEnabled && grossPay <= Number(settings.esi.wageCeiling || 0)) {
      const employeeEsi = (grossPay * Number(settings.esi.employeeRate || 0)) / 100;
      const employerEsi = (grossPay * Number(settings.esi.employerRate || 0)) / 100;
      statutoryDeductions.push({ name: "ESI", code: "ESI", type: "deduction", amount: employeeEsi, value: employeeEsi, taxable: false });
      employerContributions.push({ name: "Employer ESI", code: "ER_ESI", type: "employer_contribution", amount: employerEsi, value: employerEsi, taxable: false });
      totals.esi += employeeEsi + employerEsi;
    }
    if (settings?.professionalTax?.enabled && structure.statutoryFlags?.professionalTaxEnabled) {
      const pt = Number(settings.professionalTax.monthlyAmount || 0);
      statutoryDeductions.push({ name: "Professional Tax", code: "PT", type: "deduction", amount: pt, value: pt, taxable: false });
      totals.professionalTax += pt;
    }
    if (settings?.tds?.enabled && structure.statutoryFlags?.tdsEnabled) {
      const tds = (grossPay * Number(settings.tds.defaultRate || 0)) / 100;
      statutoryDeductions.push({ name: "TDS", code: "TDS", type: "deduction", amount: tds, value: tds, taxable: false });
      totals.tds += tds;
    }

    const loans = await EmployeeLoan.find({ schoolId, employeeId: employee._id, status: "approved", balance: { $gt: 0 } }).lean();
    const loanDeduction = loans.reduce((total, loan) => total + Math.min(Number(loan.emiAmount || 0), Number(loan.balance || 0)), 0);
    const adjustments = await PayrollAdjustment.find({ schoolId, employeeId: employee._id, cycleId: cycle._id, status: { $in: ["approved", "active"] } }).lean();
    const manualAdjustmentAmount = adjustments.reduce((total, adjustment) => total + (adjustment.type === "deduction" ? -Number(adjustment.amount || 0) : Number(adjustment.amount || 0)), 0);
    const deductions = [...materializeLines(structure.deductions, grossPay), ...statutoryDeductions];
    const totalDeductions = sum(deductions) + unpaidLeaveDeduction + loanDeduction - Math.min(0, manualAdjustmentAmount);
    const employerContribution = sum(employerContributions);
    const netPay = roundBy(grossPay - totalDeductions + Math.max(0, manualAdjustmentAmount), settings?.roundingMethod);

    totals.grossPay += grossPay;
    totals.deductions += totalDeductions;
    totals.employerContribution += employerContribution;
    totals.netPay += netPay;

    items.push({
      schoolId,
      academicYearId,
      cycleId: cycle._id,
      payrollRunId: run._id,
      employeeId: employee._id,
      employeeSnapshot: employee,
      attendanceSummary: { workingDays, presentDays: workingDays, paidLeaves: 0, unpaidLeaves, payableDays: workingDays - unpaidLeaves },
      earnings,
      deductions,
      employerContributions,
      loanDeduction,
      taxDeduction: statutoryDeductions.find((d) => d.code === "TDS")?.amount || 0,
      manualAdjustment: { amount: manualAdjustmentAmount, reason: "Approved cycle adjustments" },
      grossPay,
      totalDeductions,
      employerContribution,
      netPay,
      status: "review",
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });
  }

  if (items.length) await PayrollRunItem.insertMany(items);
  run.totals = totals;
  run.status = "review";
  run.updatedBy = req.user?._id;
  await run.save();
  cycle.totalEmployees = items.length;
  cycle.grossPay = totals.grossPay;
  cycle.deductions = totals.deductions;
  cycle.employerContribution = totals.employerContribution;
  cycle.netPay = totals.netPay;
  cycle.status = "review";
  cycle.updatedBy = req.user?._id;
  await cycle.save();
  return { run, items, totals };
};

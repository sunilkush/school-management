const money = (value) => Number(Number(value || 0).toFixed(2));

const sumNumbers = (values = []) => values.reduce((sum, val) => sum + Number(val || 0), 0);

export const buildAttendancePayrollMap = ({ attendance = {}, leave = {}, ruleEngine = [] }) => {
  const workingDays = Math.max(1, Number(attendance?.workingDays || 30));
  const presentDays = Math.max(0, Number(attendance?.presentDays || workingDays - Number(attendance?.lopDays || 0)));
  const halfDays = Math.max(0, Number(attendance?.halfDays || 0));
  const absentDays = Math.max(0, Number(attendance?.absentDays || 0));
  const overtimeHours = Math.max(0, Number(attendance?.overtimeHours || 0));
  const lateMarks = Math.max(0, Number(attendance?.lateMarks || 0));
  const shiftHours = Math.max(0, Number(attendance?.shiftHours || 0));
  const paidLeaves = Math.max(0, Number(leave?.paidLeaves || attendance?.paidLeaves || 0));
  const lopDays = Math.max(0, Number(leave?.lopDays || attendance?.lopDays || absentDays));
  const encashmentDays = Math.max(0, Number(leave?.encashmentDays || 0));
  const sandwichApplied = Boolean(leave?.sandwichApplied);

  const lateDeductionDays = ruleEngine.some((rule) => rule?.type === "late_deduction" && lateMarks > Number(rule.threshold || 3))
    ? Number(rule.deductionDays || 1)
    : 0;

  return {
    workingDays,
    presentDays,
    halfDays,
    absentDays,
    overtimeHours,
    lateMarks,
    shiftHours,
    paidLeaves,
    lopDays: lopDays + lateDeductionDays,
    encashmentDays,
    sandwichApplied,
    lateDeductionDays,
  };
};

export const computeSalary = ({ structure, attendance = {}, leave = {}, taxConfig = {}, loanEmi = 0, reimbursements = [], bonuses = [], ruleEngine = [] }) => {
  const payrollAttendance = buildAttendancePayrollMap({ attendance, leave, ruleEngine });
  const basic = Number(structure?.basic || 0);
  const hra = Number(structure?.hra || 0);
  const da = Number(structure?.da || 0);
  const conveyance = Number(structure?.conveyance || 0);
  const medical = Number(structure?.medical || 0);
  const specialAllowance = Number(structure?.specialAllowance || 0);
  const structureBonus = Number(structure?.bonus || 0);
  const structureIncentive = Number(structure?.incentive || 0);
  const approvedBonus = sumNumbers(bonuses.map((item) => item.amount));
  const approvedReimbursements = sumNumbers(reimbursements.map((item) => item.amount));
  const gross = sumNumbers([basic, hra, da, conveyance, medical, specialAllowance, structureBonus, structureIncentive, approvedBonus, approvedReimbursements]);

  const perDayGross = gross / payrollAttendance.workingDays;
  const perHourGross = perDayGross / Math.max(1, Number(payrollAttendance.shiftHours || 8));
  const leaveDeduction = perDayGross * payrollAttendance.lopDays;
  const leaveEncashment = perDayGross * payrollAttendance.encashmentDays;
  const overtime = perHourGross * Number(payrollAttendance.overtimeHours || 0) * Number(structure?.overtimeMultiplier || 1.5);

  const fixedDeductions = structure?.deductions || {};
  const pf = Number(fixedDeductions.pf || 0) || (basic * Number(taxConfig?.pfEmployeePercent || 0)) / 100;
  const esiEligibleGross = gross + overtime + leaveEncashment;
  const esi = Number(fixedDeductions.esi || 0) || (esiEligibleGross <= 21000 ? (esiEligibleGross * Number(taxConfig?.esiEmployeePercent || 0)) / 100 : 0);
  const tds = Number(fixedDeductions.tds || 0) || (esiEligibleGross * Number(taxConfig?.tdsPercent || 0)) / 100;
  const professionalTax = Number(fixedDeductions.professionalTax || 0) || Number(taxConfig?.professionalTax || 0);
  const lateFine = Number(fixedDeductions.lateFine || 0);

  const deductions = {
    pf: money(pf),
    esi: money(esi),
    professionalTax: money(professionalTax),
    tds: money(tds),
    loanEmi: money(loanEmi),
    advanceRecovery: 0,
    lateFine: money(lateFine),
    leaveDeduction: money(leaveDeduction),
  };
  const totalDeductions = money(sumNumbers(Object.values(deductions)));
  const earnings = {
    basic: money(basic),
    hra: money(hra),
    da: money(da),
    conveyance: money(conveyance),
    medical: money(medical),
    specialAllowance: money(specialAllowance),
    bonus: money(structureBonus + approvedBonus),
    incentive: money(structureIncentive),
    reimbursements: money(approvedReimbursements),
    overtime: money(overtime),
    leaveEncashment: money(leaveEncashment),
  };
  const grossEarnings = money(sumNumbers(Object.values(earnings)));
  const netSalary = money(Math.max(0, grossEarnings - totalDeductions));
  const anomalyFlags = [];

  if (payrollAttendance.lopDays > 5) anomalyFlags.push("HIGH_LOP");
  if (payrollAttendance.lateMarks > 3) anomalyFlags.push("LATE_MARK_DEDUCTION");
  if (netSalary < grossEarnings * 0.55) anomalyFlags.push("HIGH_DEDUCTION_RATIO");

  return {
    gross: grossEarnings,
    earnings,
    deductions,
    totalDeductions,
    netSalary,
    attendance: payrollAttendance,
    leave: {
      paidLeaves: payrollAttendance.paidLeaves,
      lopDays: payrollAttendance.lopDays,
      encashmentDays: payrollAttendance.encashmentDays,
      sandwichApplied: payrollAttendance.sandwichApplied,
    },
    compliance: {
      taxRegime: taxConfig?.taxRegime || "new",
      pfEmployee: deductions.pf,
      esiEmployee: deductions.esi,
      tds,
      professionalTax,
    },
    anomalyFlags,
  };
};

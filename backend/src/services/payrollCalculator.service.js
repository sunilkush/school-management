const applyRounding = (value, roundingMode = "nearest") => {
  if (roundingMode === "up") return Math.ceil(value);
  if (roundingMode === "down") return Math.floor(value);
  return Math.round(value);
};

export const calculatePayrollEntry = ({
  structure,
  attendance,
  policy,
  reimbursements = 0,
  otherDeductions = 0,
}) => {
  const workingDays = Number(attendance.workingDays || 0);
  const presentDays = Number(attendance.presentDays || 0);
  const leaveDays = Number(attendance.leaveDays || 0);

  const paidLeaveLimit = Number(policy.paidLeavePerMonth || 0);
  const paidLeaves = Math.min(leaveDays, paidLeaveLimit);
  const lopDays = Math.max(workingDays - (presentDays + paidLeaves), 0);

  const gross = Number(structure.grossMonthly || 0);
  const perDay = workingDays > 0 ? gross / workingDays : 0;
  const lopDeduction = lopDays * perDay;

  const pf = structure.pfEnabled ? (Number(policy.pfPercent || 0) / 100) * Number(structure.basic || 0) : 0;
  const esi = structure.esiEnabled ? (Number(policy.esiPercent || 0) / 100) * gross : 0;
  const professionalTax = structure.professionalTaxEnabled ? Number(policy.professionalTaxAmount || 0) : 0;

  const statutoryDeductions = pf + esi + professionalTax;
  const totalDeductions = lopDeduction + statutoryDeductions + Number(otherDeductions || 0);
  const netRaw = gross - totalDeductions + Number(reimbursements || 0);
  const netPay = applyRounding(netRaw, policy.roundingMode);

  return {
    attendance: {
      workingDays,
      presentDays,
      paidLeaves,
      lopDays,
    },
    earningsBreakdown: {
      basic: Number(structure.basic || 0),
      hra: Number(structure.hra || 0),
      da: Number(structure.da || 0),
      specialAllowance: Number(structure.specialAllowance || 0),
      reimbursements: Number(reimbursements || 0),
    },
    deductionsBreakdown: {
      lopDeduction,
      pf,
      esi,
      professionalTax,
      otherDeductions: Number(otherDeductions || 0),
    },
    grossEarnings: gross,
    totalDeductions,
    netPay,
  };
};

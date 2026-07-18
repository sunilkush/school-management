const applyRounding = (value, roundingMode = "nearest") => {
  if (roundingMode === "up") return Math.ceil(value);
  if (roundingMode === "down") return Math.floor(value);
  return Math.round(value);
};

// Earning components a "custom" applicability list can reference by name.
const COMPONENT_FIELDS = ["basic", "hra", "da", "conveyance", "medical", "specialAllowance", "bonus", "incentive"];

const sumComponents = (structure, componentNames = []) =>
  componentNames.reduce((total, name) => {
    if (!COMPONENT_FIELDS.includes(name)) return total; // ignore unknown/typo'd names rather than throwing mid-payroll-run
    return total + Number(structure[name] || 0);
  }, 0);

// Resolves the statutory PF wage base for a structure. The wage-base *methodology* (Basic vs
// Basic+DA vs Custom) is this school's policy, not a per-employee choice — it comes from
// `policy`, the same place the rates themselves come from, so it's configured in one place.
const resolvePfWage = (structure, policy) => {
  const basic = Number(structure.basic || 0);
  const da = Number(structure.da || 0);
  switch (policy.pfApplicableOn) {
    case "basic":
      return basic;
    case "custom":
      return sumComponents(structure, policy.pfCustomComponents);
    case "basicPlusDa":
    default:
      return basic + da;
  }
};

const resolveEsiWage = (structure, policy, gross) => {
  if (policy.esiApplicableOn === "custom") {
    return sumComponents(structure, policy.esiCustomComponents);
  }
  return gross; // "gross" — statutory default
};

export const calculatePayrollEntry = ({
  structure,
  attendance,
  policy,
  employeeStatutory = null,
  reimbursements = 0,
  otherDeductions = 0,
}) => {
  // PF/ESI on/off is a single school-wide switch (policy.pfEnabled/esiEnabled) — there's no
  // per-structure toggle any more. An individual employee can still be excluded from either
  // (e.g. an international worker, or opted out at joining) via pfCategory/esiCategory
  // === "excluded" on their statutory record, which is the one remaining per-employee lever.
  const pfEnabled = Boolean(policy.pfEnabled) && employeeStatutory?.pfCategory !== "excluded";
  const esiEnabled = Boolean(policy.esiEnabled) && employeeStatutory?.esiCategory !== "excluded";
  const workingDays = Number(attendance.workingDays || 0);
  const presentDays = Number(attendance.presentDays || 0);
  const leaveDays = Number(attendance.leaveDays || 0);

  const paidLeaveLimit = Number(policy.paidLeavePerMonth || 0);
  const paidLeaves = Math.min(leaveDays, paidLeaveLimit);
  const lopDays = Math.max(workingDays - (presentDays + paidLeaves), 0);
  const lateCount = Number(attendance.lateCount || 0);
  const overtimeHours = Number(attendance.overtimeHours || 0);

  const gross = Number(structure.grossMonthly || 0);
  const perDay = workingDays > 0 ? gross / workingDays : 0;
  const lopDeduction = lopDays * perDay;

  // ── EPF: statutory wage base defaults to Basic + DA, capped at the PF wage ceiling
  // (₹15,000/month by default) unless the school has opted for PF on full wages. VPF
  // (Voluntary PF) rides on top of the statutory employee % on the same wage base, and is
  // NOT subject to the wage ceiling (an employee may voluntarily contribute more). ──
  const pfWageCeiling = Number(policy.pfWageCeiling ?? 15000);
  const rawPfWage = resolvePfWage(structure, policy);
  const pfWage = policy.pfAppliedOnCeiling === false ? rawPfWage : Math.min(rawPfWage, pfWageCeiling);
  const statutoryPf = pfEnabled ? (Number(policy.pfPercent || 0) / 100) * pfWage : 0;
  const vpf = pfEnabled ? (Number(structure.vpfPercent || 0) / 100) * rawPfWage : 0;
  const pf = statutoryPf + vpf;

  // ── ESI: only applicable while gross wages stay within the eligibility ceiling
  // (₹21,000/month by default) — above it the employee is simply not ESI-covered. ──
  const esiWageCeiling = Number(policy.esiWageCeiling ?? 21000);
  const esiEligible = esiEnabled && gross <= esiWageCeiling;
  const esiWage = esiEligible ? resolveEsiWage(structure, policy, gross) : 0;
  const esi = esiEligible ? (Number(policy.esiPercent || 0) / 100) * esiWage : 0;

  const professionalTax = structure.professionalTaxEnabled ? Number(policy.professionalTaxAmount || 0) : 0;

  const statutoryDeductions = pf + esi + professionalTax;

  // ── Employer-side statutory contributions — informational (employer's cost, not
  // deducted from the employee) but needed for CTC and PF/ESI return filing. EPS is always
  // capped at the wage ceiling by statute, regardless of pfAppliedOnCeiling. VPF has no
  // employer counterpart — it is purely an employee-elected extra contribution. ──
  const epsWage = Math.min(rawPfWage, pfWageCeiling);
  const employerPfTotal = pfEnabled ? (Number(policy.employerPfPercent || 0) / 100) * pfWage : 0;
  const employerEps = pfEnabled ? (Number(policy.epsPercent || 0) / 100) * epsWage : 0;
  const employerEpf = Math.max(employerPfTotal - employerEps, 0);
  const epfAdminCharges = pfEnabled ? (Number(policy.epfAdminChargesPercent || 0) / 100) * pfWage : 0;
  const edli = pfEnabled ? (Number(policy.edliPercent || 0) / 100) * pfWage : 0;
  const employerEsi = esiEligible ? (Number(policy.employerEsiPercent || 0) / 100) * esiWage : 0;

  const lateFine = Number(structure?.deductions?.lateFine || 0) * lateCount;
  const tds = Number(structure?.deductions?.tds || 0);
  const overtimeRatePerHour = Number(policy.overtimeRatePerHour || 0);
  const overtimePay = overtimeHours * overtimeRatePerHour;
  const totalDeductions = lopDeduction + statutoryDeductions + lateFine + tds + Number(otherDeductions || 0);
  const netRaw = gross - totalDeductions + Number(reimbursements || 0) + overtimePay;
  const netPay = applyRounding(netRaw, policy.roundingMode);

  return {
    attendance: {
      workingDays,
      presentDays,
      paidLeaves,
      lopDays,
      lateCount,
      overtimeHours,
    },
    earningsBreakdown: {
      basic: Number(structure.basic || 0),
      hra: Number(structure.hra || 0),
      da: Number(structure.da || 0),
      specialAllowance: Number(structure.specialAllowance || 0),
      reimbursements: Number(reimbursements || 0),
      overtimePay,
    },
    deductionsBreakdown: {
      lopDeduction,
      pf,
      statutoryPf,
      vpf,
      pfWage,
      esi,
      esiWage,
      esiEligible,
      professionalTax,
      lateFine,
      tds,
      otherDeductions: Number(otherDeductions || 0),
    },
    // Employer's own statutory cost for this employee — not part of net pay,
    // kept alongside the payslip for CTC visibility and PF/ESI return filing.
    employerContributions: {
      eps: employerEps,
      epf: employerEpf,
      pfTotal: employerPfTotal,
      epfAdminCharges,
      edli,
      esi: employerEsi,
    },
    grossEarnings: gross,
    totalDeductions,
    netPay,
  };
};

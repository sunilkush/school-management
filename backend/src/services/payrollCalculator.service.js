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
const resolvePfWage = (structure, policy, period) => {
  const basic = Number(structure.basic || 0);
  const da = Number(structure.da || 0);
  let wage;
  switch (policy.pfApplicableOn) {
    case "basic":
      wage = basic;
      break;
    case "custom":
      wage = sumComponents(structure, policy.pfCustomComponents);
      break;
    case "basicPlusDa":
    default:
      wage = basic + da;
  }
  // Labour codes (in force 21 Nov 2025), "wages" in s.2(88) Code on Social Security: when the
  // allowances left out of wages (HRA, special allowance, …) are more than half of the whole
  // pay, the excess counts as wages. A low basic can no longer shrink PF: wages are at least
  // half of gross.
  if (periodEnd(period) >= LABOUR_CODES_FROM) {
    wage = Math.max(wage, Number(structure.grossMonthly || 0) / 2);
  }
  return wage;
};

const LABOUR_CODES_FROM = Date.UTC(2025, 10, 21);

// Statutory PF wage ceiling (s.2(89) Code on Social Security). ₹15,000 since 2014; ₹25,000 from
// 17 Sep 2026 (S.O. 5109(E)) for EPF, EPS and EDLI alike. Newest first.
const PF_CEILINGS = [
  { from: Date.UTC(2026, 8, 17), ceiling: 25000 },
  { from: 0, ceiling: 15000 },
];

const periodEnd = (period) => (period
  ? Date.UTC(period.year, period.month, 0)
  : Date.now());

/**
 * The month split by the ceiling in force on each day, as [{ days, of, ceiling }]. EPFO: for a month
 * the ceiling changes in (September 2026), the days before and after are worked out separately.
 * A school's own higher ceiling (policy.pfWageCeiling) still applies; a lower one saved before
 * the change does not undercut the law.
 */
const pfCeilingShares = (period, configured) => {
  // A saved 15,000 or 25,000 is just the statutory figure (the settings default), not a choice
  // to pay PF on more, so it must not stretch 25,000 back over 1–16 September.
  const own = configured > PF_CEILINGS[0].ceiling ? configured : 0;
  const at = (t) => Math.max(PF_CEILINGS.find((c) => t >= c.from).ceiling, own);
  if (!period) return [{ days: 1, of: 1, ceiling: at(Date.now()) }];
  const days = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  const shares = [];
  for (let d = 1; d <= days; d += 1) {
    const ceiling = at(Date.UTC(period.year, period.month - 1, d));
    const last = shares[shares.length - 1];
    if (last && last.ceiling === ceiling) last.days += 1;
    else shares.push({ days: 1, of: days, ceiling });
  }
  return shares;
};

// Wage capped by the ceiling, day-weighted across a month the ceiling changed in.
const capToCeiling = (wage, shares) => shares.reduce((sum, s) => sum + (s.days * Math.min(wage, s.ceiling)) / s.of, 0);

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
  // { year, month } of the payroll cycle: which ceiling and wage rules were in force. Omitted,
  // today's rules apply.
  period = null,
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
  // in force (₹25,000 from 17 Sep 2026) unless the school has opted for PF on full wages. VPF
  // (Voluntary PF) rides on top of the statutory employee % on the same wage base, and is
  // NOT subject to the wage ceiling (an employee may voluntarily contribute more). ──
  const ceilingShares = pfCeilingShares(period, Number(policy.pfWageCeiling || 0));
  // PF and ESI are due on wages actually earned. Charged on the full month's wage, an absent
  // employee (all days LOP) was left owing PF: a negative payslip.
  const earnedRatio = workingDays > 0 ? Math.max(workingDays - lopDays, 0) / workingDays : 1;
  const rawPfWage = resolvePfWage(structure, policy, period) * earnedRatio;
  const pfWage = policy.pfAppliedOnCeiling === false ? rawPfWage : capToCeiling(rawPfWage, ceilingShares);
  const statutoryPf = pfEnabled ? (Number(policy.pfPercent || 0) / 100) * pfWage : 0;
  const vpf = pfEnabled ? (Number(structure.vpfPercent || 0) / 100) * rawPfWage : 0;
  const pf = statutoryPf + vpf;

  // ── ESI: only applicable while gross wages stay within the eligibility ceiling
  // (₹21,000/month by default) — above it the employee is simply not ESI-covered. ──
  const esiWageCeiling = Number(policy.esiWageCeiling ?? 21000);
  const esiEligible = esiEnabled && gross <= esiWageCeiling;
  const esiWage = esiEligible ? resolveEsiWage(structure, policy, gross) * earnedRatio : 0;
  const esi = esiEligible ? (Number(policy.esiPercent || 0) / 100) * esiWage : 0;

  const professionalTax = structure.professionalTaxEnabled ? Number(policy.professionalTaxAmount || 0) : 0;

  const statutoryDeductions = pf + esi + professionalTax;

  // ── Employer-side statutory contributions — informational (employer's cost, not
  // deducted from the employee) but needed for CTC and PF/ESI return filing. EPS is always
  // capped at the wage ceiling by statute, regardless of pfAppliedOnCeiling. VPF has no
  // employer counterpart — it is purely an employee-elected extra contribution. ──
  const epsWage = capToCeiling(rawPfWage, ceilingShares);
  const employerPfTotal = pfEnabled ? (Number(policy.employerPfPercent || 0) / 100) * pfWage : 0;
  const employerEps = pfEnabled ? (Number(policy.epsPercent || 0) / 100) * epsWage : 0;
  const employerEpf = Math.max(employerPfTotal - employerEps, 0);
  const epfAdminCharges = pfEnabled ? (Number(policy.epfAdminChargesPercent || 0) / 100) * pfWage : 0;
  const edli = pfEnabled ? (Number(policy.edliPercent || 0) / 100) * epsWage : 0;
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

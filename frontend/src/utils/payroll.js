import dayjs from "dayjs";

export const formatCurrencyINR = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Mirrors payrollPolicy.model.js's own schema defaults — used only when a school hasn't
// loaded/configured its Payroll Settings yet, so the estimate below still has something
// sane to fall back on instead of guessing.
export const DEFAULT_PAYROLL_SETTINGS = {
  pfEnabled: true,
  pfPercent: 12,
  pfWageCeiling: 15000,
  pfAppliedOnCeiling: true,
  pfApplicableOn: "basicPlusDa",
  pfCustomComponents: [],
  esiEnabled: true,
  esiPercent: 0.75,
  esiWageCeiling: 21000,
  esiApplicableOn: "gross",
  esiCustomComponents: [],
  professionalTaxAmount: 0,
};

const PAYROLL_COMPONENT_FIELDS = ["basic", "hra", "da", "conveyance", "medical", "specialAllowance", "bonus", "incentive"];
const sumPayrollComponents = (structure, componentNames = []) =>
  componentNames.reduce((total, name) => (
    PAYROLL_COMPONENT_FIELDS.includes(name) ? total + Number(structure[name] || 0) : total
  ), 0);

// Frontend mirror of backend/src/services/payrollCalculator.service.js's PF/ESI/PT shape,
// parameterized by this school's *actual* configured Payroll Settings (falling back to
// statutory defaults only if settings haven't loaded). Used by both the Salary Structure
// form's live preview and the structures table's Deductions column, so the two can't drift
// out of sync with each other — or with what a real payroll cycle will actually deduct.
// Still an estimate: it can't account for attendance/LOP, which only the real cycle run knows.
// Note: whether PF/ESI apply at all (pfEnabled/esiEnabled), and the wage-base methodology
// (pfApplicableOn/esiApplicableOn), both come entirely from `settings` now — school-wide
// policy, not something the structure itself decides. A per-employee "excluded" category
// override (Employee.statutoryCompliance.pfCategory/esiCategory) also exists on the backend
// but isn't reflected in this preview, since the structure form doesn't load employee
// statutory data — the real payroll cycle is always the authoritative figure either way.
export const estimatePayrollDeductions = (structure, settings) => {
  const s = { ...DEFAULT_PAYROLL_SETTINGS, ...settings };
  const basic = Number(structure.basic || 0);
  const da = Number(structure.da || 0);
  const gross = Number(structure.grossMonthly ?? (basic + da + Number(structure.hra || 0) + Number(structure.specialAllowance || 0)));

  const rawPfWage = s.pfApplicableOn === "basic"
    ? basic
    : s.pfApplicableOn === "custom"
      ? sumPayrollComponents(structure, s.pfCustomComponents)
      : basic + da;
  const pfWage = s.pfAppliedOnCeiling === false ? rawPfWage : Math.min(rawPfWage, s.pfWageCeiling);
  const statutoryPf = s.pfEnabled ? (Number(s.pfPercent) / 100) * pfWage : 0;
  const vpf = s.pfEnabled ? (Number(structure.vpfPercent || 0) / 100) * rawPfWage : 0;
  const pf = statutoryPf + vpf;

  const esiEligible = Boolean(s.esiEnabled) && gross <= s.esiWageCeiling;
  const esiWage = esiEligible
    ? (s.esiApplicableOn === "custom" ? sumPayrollComponents(structure, s.esiCustomComponents) : gross)
    : 0;
  const esi = esiEligible ? (Number(s.esiPercent) / 100) * esiWage : 0;

  const professionalTax = structure.professionalTaxEnabled ? Number(s.professionalTaxAmount) : 0;

  return { pf, statutoryPf, vpf, esi, esiEligible, professionalTax, total: pf + esi + professionalTax };
};

export const formatPayrollMonth = (month, year) =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY");

export const getPayrollActionPermissions = (roleName, cycleStatus) => {
  const role = (roleName || "").toLowerCase();
  const fullAccess = ["super admin", "school admin", "accountant"].includes(role);
  const reviewAccess = ["super admin", "school admin", "accountant", "principal", "admin"].includes(role);

  return {
    canGenerate: fullAccess && (!cycleStatus || cycleStatus === "draft"),
    canLock: reviewAccess && cycleStatus === "draft",
    canPay: fullAccess && cycleStatus === "locked",
  };
};

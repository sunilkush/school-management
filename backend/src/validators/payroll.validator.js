import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const pfApplicabilityEnum = z.enum(["basic", "basicPlusDa", "custom"]);
const esiApplicabilityEnum = z.enum(["gross", "custom"]);

export const payrollStructureCreateSchema = z.object({
  body: z.object({
    schoolId: objectId.optional(),
    employeeId: objectId,
    basic: z.number().nonnegative(),
    hra: z.number().nonnegative().default(0),
    da: z.number().nonnegative().default(0),
    specialAllowance: z.number().nonnegative().default(0),
    grossMonthly: z.number().nonnegative(),
    // PF/ESI on/off is NOT configured here — it's a single school-wide switch in Payroll
    // Settings (payrollSettingsCreateSchema below). Only the voluntary top-up (VPF) and
    // Professional Tax's own on/off (a separate, unrelated deduction) live on the structure.
    vpfPercent: z.number().min(0).max(100).default(0),
    professionalTaxEnabled: z.boolean().default(false),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().nullable().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const payrollStructureUpdateSchema = z.object({
  body: z
    .object({
      basic: z.number().nonnegative().optional(),
      hra: z.number().nonnegative().optional(),
      da: z.number().nonnegative().optional(),
      specialAllowance: z.number().nonnegative().optional(),
      grossMonthly: z.number().nonnegative().optional(),
      vpfPercent: z.number().min(0).max(100).optional(),
      professionalTaxEnabled: z.boolean().optional(),
      effectiveFrom: z.coerce.date().optional(),
      effectiveTo: z.coerce.date().nullable().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
  params: z.object({ id: objectId }),
  query: z.object({ schoolId: objectId.optional() }).optional().default({}),
});

// ── Payroll Settings (versioned PayrollPolicy) — the single place PF/ESI rates AND the
// wage-base methodology are configured for this school. ──────────────────────────────
export const payrollSettingsCreateSchema = z.object({
  body: z.object({
    schoolId: objectId.optional(),
    pfEnabled: z.boolean().default(true),
    pfPercent: z.number().min(0).max(100).default(12),
    pfWageCeiling: z.number().nonnegative().default(15000),
    pfAppliedOnCeiling: z.boolean().default(true),
    pfApplicableOn: pfApplicabilityEnum.default("basicPlusDa"),
    pfCustomComponents: z.array(z.string()).default([]),
    employerPfPercent: z.number().min(0).max(100).default(12),
    epsPercent: z.number().min(0).max(100).default(8.33),
    epfAdminChargesPercent: z.number().min(0).max(100).default(0.5),
    edliPercent: z.number().min(0).max(100).default(0.5),
    esiEnabled: z.boolean().default(true),
    esiPercent: z.number().min(0).max(100).default(0.75),
    esiWageCeiling: z.number().nonnegative().default(21000),
    esiApplicableOn: esiApplicabilityEnum.default("gross"),
    esiCustomComponents: z.array(z.string()).default([]),
    employerEsiPercent: z.number().min(0).max(100).default(3.25),
    professionalTaxAmount: z.number().nonnegative().default(0),
    paidLeavePerMonth: z.number().nonnegative().default(1),
    roundingMode: z.enum(["nearest", "up", "down"]).default("nearest"),
    payDateDayOfMonth: z.number().int().min(1).max(28).default(1),
    overtimeRatePerHour: z.number().nonnegative().default(0),
    effectiveFrom: z.coerce.date(),
    notes: z.string().trim().max(300).optional(),
  })
    // "custom" with an empty component list would silently zero the PF/ESI wage for the whole
    // school instead of erroring, so this is required, not just defaulted to [].
    .refine((v) => !(v.pfApplicableOn === "custom" && v.pfCustomComponents.length === 0), {
      message: "pfCustomComponents must have at least one entry when pfApplicableOn is 'custom'",
      path: ["pfCustomComponents"],
    })
    .refine((v) => !(v.esiApplicableOn === "custom" && v.esiCustomComponents.length === 0), {
      message: "esiCustomComponents must have at least one entry when esiApplicableOn is 'custom'",
      path: ["esiCustomComponents"],
    }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

// ── Employee statutory (PF/ESI) details — identity/reference fields only. Whether PF/ESI
// applies is the salary structure's pfEnabled/esiEnabled toggle, not repeated here. ──────
export const employeeStatutoryUpdateSchema = z.object({
  body: z
    .object({
      uan: z
        .string()
        .regex(/^\d{12}$/, "UAN must be exactly 12 digits")
        .nullable()
        .optional(),
      pfJoiningDate: z.coerce.date().nullable().optional(),
      pfExitDate: z.coerce.date().nullable().optional(),
      pfCategory: z.enum(["general", "international_worker", "excluded"]).optional(),
      esicNumber: z
        .string()
        .regex(/^\d{10,17}$/, "ESIC number must be 10-17 digits")
        .nullable()
        .optional(),
      esiJoiningDate: z.coerce.date().nullable().optional(),
      esiCategory: z.enum(["general", "disability", "excluded"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
    .refine(
      (value) =>
        !value.pfJoiningDate || !value.pfExitDate || value.pfExitDate >= value.pfJoiningDate,
      { message: "pfExitDate cannot be before pfJoiningDate", path: ["pfExitDate"] }
    ),
  params: z.object({ employeeId: objectId }),
  query: z.object({ schoolId: objectId.optional() }).optional().default({}),
});

export const payrollCycleGenerateSchema = z.object({
  body: z.object({
    schoolId: objectId.optional(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    cycleType: z.enum(["monthly", "weekly", "custom"]).default("monthly").optional(),
    cycleStartDate: z.coerce.date().optional(),
    cycleEndDate: z.coerce.date().optional(),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const payrollCycleQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
  query: z.object({ schoolId: objectId.optional() }).optional().default({}),
});

export const payrollCycleActionSchema = z.object({
  body: z.object({
    schoolId: objectId.optional(),
    transactionRefPrefix: z.string().trim().min(2).max(40).optional(),
    paymentMode: z.enum(["bank", "cash", "upi", "cheque", "other"]).optional(),
  }).optional().default({}),
  params: z.object({ id: objectId }),
  query: z.object({}).optional().default({}),
});

export const payslipQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    employeeId: objectId,
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
  query: z.object({ schoolId: objectId.optional() }).optional().default({}),
});

export const payrollReportQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    schoolId: objectId.optional(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

export const payrollStatutoryReportQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    schoolId: objectId.optional(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    export: z.enum(["csv"]).optional(),
  }),
});

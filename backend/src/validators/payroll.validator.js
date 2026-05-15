import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const payrollStructureCreateSchema = z.object({
  body: z.object({
    schoolId: objectId.optional(),
    employeeId: objectId,
    basic: z.number().nonnegative(),
    hra: z.number().nonnegative().default(0),
    da: z.number().nonnegative().default(0),
    specialAllowance: z.number().nonnegative().default(0),
    grossMonthly: z.number().nonnegative(),
    pfEnabled: z.boolean().default(true),
    esiEnabled: z.boolean().default(false),
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
      pfEnabled: z.boolean().optional(),
      esiEnabled: z.boolean().optional(),
      professionalTaxEnabled: z.boolean().optional(),
      effectiveFrom: z.coerce.date().optional(),
      effectiveTo: z.coerce.date().nullable().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
  params: z.object({ id: objectId }),
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

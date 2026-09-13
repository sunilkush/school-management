import { z } from "zod";

export const feeSettingsUpdateSchema = z.object({
  body: z.object({
    dueDay: z.coerce.number().int().min(1).max(28),
    lateFine: z.object({
      enabled: z.coerce.boolean(),
      type: z.enum(["fixed", "per_day"]),
      amount: z.coerce.number().min(0),
      graceDays: z.coerce.number().int().min(0).max(90).default(0),
      maxAmount: z.coerce.number().min(0).default(0),
    }),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

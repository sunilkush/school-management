import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const paymentModeEnum = z.enum(["cash", "upi", "card", "bank_transfer", "cheque", "online", "gateway", "razorpay"]);

export const createPaymentSchema = z.object({
  body: z
    .object({
      studentId: objectId,
      // One receipt can pay several installments — April and May tuition, April transport.
      installmentIds: z.array(objectId).min(1, "Select at least one installment").max(60),
      // Required for counter modes (may be less than due: a partial payment); ignored for razorpay,
      // which always charges what the selected installments owe.
      amount: z.coerce.number().positive().optional(),
      paymentMethod: paymentModeEnum.optional(),
      paymentMode: paymentModeEnum.optional(),
      referenceNo: z.string().trim().max(100).optional(),
      remarks: z.string().trim().max(500).optional(),
    })
    .refine((data) => data.paymentMethod || data.paymentMode, {
      message: "paymentMethod or paymentMode is required",
      path: ["paymentMode"],
    }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

// The body is ignored — confirmation comes from asking the gateway — but a Razorpay popup's
// handler response is still accepted as-is.
export const verifyPaymentSchema = z.object({
  body: z.object({}).passthrough().optional().default({}),
  params: z.object({ id: objectId }),
  query: z.object({}).optional().default({}),
});

export const paymentListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectId.optional(),
  }).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    paymentMode: z.string().optional(),
    studentId: objectId.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    reason: z.string().trim().min(1, "reason is required"),
    refundMode: z.enum(["cash", "online", "cheque", "bank_transfer", "upi", "card", "adjustment"]).optional(),
    transactionId: z.string().trim().optional(),
  }),
  params: z.object({
    id: objectId,
  }),
  query: z.object({}).optional().default({}),
});

export const refundListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    studentId: objectId.optional(),
    paymentId: objectId.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const paymentModeEnum = z.enum(["cash", "online", "cheque", "razorpay"]);

export const createPaymentSchema = z.object({
  body: z
    .object({
      studentId: objectId.optional(),
      installmentId: objectId,
      amount: z.coerce.number().positive().optional(),
      paymentMethod: paymentModeEnum.optional(),
      paymentMode: paymentModeEnum.optional(),
      transactionId: z.string().trim().optional(),
      razorpay: z
        .object({
          razorpay_order_id: z.string().min(1),
          razorpay_payment_id: z.string().min(1),
          razorpay_signature: z.string().min(1),
        })
        .optional(),
    })
    .refine((data) => data.paymentMethod || data.paymentMode, {
      message: "paymentMethod or paymentMode is required",
      path: ["paymentMode"],
    }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    installmentId: objectId,
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    installmentId: objectId,
  }),
  params: z.object({}).optional().default({}),
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
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    reason: z.string().trim().min(1, "reason is required"),
    refundMode: z.enum(["cash", "online", "cheque", "bank_transfer", "upi", "adjustment"]).optional(),
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

export const razorpayConfigUpdateSchema = z.object({
  body: z.object({
    keyId: z.string().trim().min(1, "keyId is required"),
    keySecret: z.string().trim().optional(),
    accountId: z.string().trim().optional(),
    isEnabled: z.coerce.boolean().default(false),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

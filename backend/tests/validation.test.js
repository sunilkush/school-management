import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentSchema } from "../src/validators/payment.validator.js";

test("createPaymentSchema rejects invalid payload", () => {
  const parsed = createPaymentSchema.safeParse({
    body: { studentId: "bad", installmentId: "bad", amount: -1, paymentMethod: "upi" },
    params: {},
    query: {},
  });

  assert.equal(parsed.success, false);
});

test("createPaymentSchema accepts valid payload", () => {
  const parsed = createPaymentSchema.safeParse({
    body: {
      studentId: "507f1f77bcf86cd799439011",
      installmentId: "507f1f77bcf86cd799439012",
      amount: 100,
      paymentMethod: "cash",
    },
    params: {},
    query: {},
  });

  assert.equal(parsed.success, true);
});

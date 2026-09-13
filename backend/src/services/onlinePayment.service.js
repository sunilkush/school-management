import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { applyInstallmentPayment } from "./feePayment.service.js";
import { round2 } from "./feeSchedule.service.js";
import { getAdapter } from "./paymentGateways/index.js";
import { gatewayLabel } from "./paymentGateways/providers.js";
import { getActiveGateway, getGatewayForSettlement } from "./schoolPaymentGateway.service.js";

/**
 * Online fee payment through whichever gateway the school has active.
 *
 *   1. startOnlineCheckout  — a pending Payment for the chosen installments, and a checkout on the
 *                             school's gateway tied to it
 *   2. the payer pays on the gateway (SDK popup, hosted form, or redirect)
 *   3. confirmOnlinePayment — prompted by the browser returning, the verify call, or a webhook,
 *                             the server asks the gateway what happened and, only if it says
 *                             "paid", applies the amount it reports
 */

const newReceiptNo = () => `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** Base URL gateways call back on. Behind a proxy set API_PUBLIC_URL; the Host header is a fallback. */
export const apiBaseUrl = (req) =>
  (process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");

export const frontendBaseUrl = () => (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

export const gatewayWebhookUrl = (req, provider, schoolId) => `${apiBaseUrl(req)}/api/v1/webhooks/gateway/${provider}/${schoolId}`;

const isWriteConflict = (err) =>
  err?.code === 112 || (typeof err?.hasErrorLabel === "function" && err.hasErrorLabel("TransientTransactionError"));

/**
 * Applies money the gateway has confirmed to the checkout it was for. Shared by every prompt —
 * return, verify, webhook — which can race each other for the same payment. The first write
 * inside the transaction claims the pending Payment; a loser either finds it already settled or
 * collides with the winner's write, and in both cases gets the winner's result back. Money beyond
 * what the installments still owe (settled some other way meanwhile) is kept as
 * unallocatedAmount for the office to refund, never dropped.
 */
export const settleOnlinePayment = async ({ paymentId, schoolId, gatewayOrderId, gatewayPaymentId, amountPaid, gatewayResponse }) => {
  const match = { _id: paymentId, schoolId, gatewayOrderId };
  const settled = () => Payment.findOne({ ...match, status: { $ne: "pending" } });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findOneAndUpdate(
      { ...match, status: "pending" },
      { $set: { status: "success", transactionId: gatewayPaymentId, amountPaid, gatewayResponse, paymentDate: new Date() } },
      { new: true, session }
    );
    if (!payment) {
      await session.abortTransaction();
      const existing = await settled();
      if (!existing) throw new ApiError(404, "Payment not found");
      return { payment: existing, alreadyRecorded: true };
    }

    const { allocations, excess } = await applyInstallmentPayment({
      schoolId,
      studentId: payment.studentId,
      installmentIds: payment.requestedInstallmentIds,
      amount: amountPaid,
      allowExcess: true,
      session,
    });

    payment.allocations = allocations;
    payment.unallocatedAmount = round2(excess);
    await payment.save({ session });

    await session.commitTransaction();
    return { payment };
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    if (isWriteConflict(err) || err?.code === 11000) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const existing = await settled();
      if (existing) return { payment: existing, alreadyRecorded: true };
    }
    throw err;
  } finally {
    session.endSession();
  }
};

/** Where a parent or student lands after paying, by role. Never taken from the request. */
const returnPathFor = (roleName) =>
  ({ parent: "/dashboard/parent/fees", student: "/dashboard/student/fees" })[String(roleName || "").toLowerCase()] || "/dashboard";

/**
 * Starts an online checkout on the school's active gateway for `payable` (already worked out by
 * the caller from today's installment balances).
 */
export const startOnlineCheckout = async ({ req, schoolId, studentId, installments, payable, user }) => {
  const active = await getActiveGateway(schoolId);
  if (!active) {
    throw new ApiError(400, "Online payment is not set up for this school yet. Please pay at the school office.");
  }

  const payment = await Payment.create({
    schoolId,
    studentId,
    academicYearId: installments[0].academicYearId,
    requestedInstallmentIds: installments.map((i) => i._id),
    amountPaid: payable,
    paymentMode: "online",
    gateway: active.provider,
    status: "pending",
    receiptNo: newReceiptNo(),
    checkoutReturnPath: returnPathFor(user?.roleId?.name),
  });

  const orderId = String(payment._id);
  let result;
  try {
    result = await getAdapter(active.provider).createCheckout({
      creds: active.creds,
      mode: active.mode,
      orderId,
      amount: payable,
      schoolId,
      description: `School fee — ${installments.length} installment${installments.length > 1 ? "s" : ""}`,
      customer: { id: String(studentId), name: user?.name, email: user?.email, phone: user?.phone },
      urls: {
        returnUrl: `${apiBaseUrl(req)}/api/v1/payments/return/${orderId}`,
        webhookUrl: gatewayWebhookUrl(req, active.provider, schoolId),
      },
    });
  } catch (err) {
    payment.status = "failed";
    await payment.save();
    throw err;
  }

  payment.gatewayOrderId = result.gatewayOrderId;
  payment.gatewayMeta = result.meta || null;
  await payment.save();

  return { paymentId: payment._id, gateway: active.provider, gatewayLabel: gatewayLabel(active.provider), amount: payable, checkout: result.checkout };
};

/**
 * Asks the checkout's gateway what happened and settles it if paid. Returns
 * { state: "paid" | "pending" | "failed", payment }.
 */
export const confirmOnlinePayment = async (payment) => {
  if (payment.status === "success" || payment.status === "refunded") return { state: "paid", payment };
  if (payment.status !== "pending") return { state: "failed", payment };
  if (!payment.gatewayOrderId) return { state: "failed", payment };

  const provider = payment.gateway || "razorpay";
  const gw = await getGatewayForSettlement(payment.schoolId, provider);
  const status = await getAdapter(provider).fetchStatus({
    creds: gw.creds,
    mode: gw.mode,
    gatewayOrderId: payment.gatewayOrderId,
    meta: payment.gatewayMeta,
  });

  if (status.state === "paid") {
    if (!(Number(status.amount) > 0)) throw new ApiError(502, `${gatewayLabel(provider)} reported a payment without an amount`);
    const reference = status.gatewayPaymentId || payment.gatewayOrderId;
    const { payment: settled } = await settleOnlinePayment({
      paymentId: payment._id,
      schoolId: payment.schoolId,
      gatewayOrderId: payment.gatewayOrderId,
      // transactionId is globally unique; prefix non-Razorpay ids so two gateways' numbering can never collide.
      gatewayPaymentId: provider === "razorpay" ? reference : `${provider}:${reference}`,
      amountPaid: round2(status.amount),
      gatewayResponse: status.raw ?? null,
    });
    return { state: "paid", payment: settled };
  }

  if (status.state === "failed") {
    await Payment.updateOne({ _id: payment._id, status: "pending" }, { $set: { status: "failed", gatewayResponse: status.raw ?? null } });
    return { state: "failed", payment: await Payment.findById(payment._id) };
  }

  return { state: "pending", payment };
};

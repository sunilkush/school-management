import PDFDocument from "pdfkit";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { SubscriptionInvoice } from "../models/SubscriptionInvoice.model.js";
import { School } from "../models/school.model.js";
import { GlobalConfig } from "../models/GlobalConfig.model.js";
import { createOrder, verifyPaymentSignature } from "../services/paymentGateway/razorpayGateway.js";
import { recordSubscriptionPayment } from "./superAdminBilling.controllers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import { renderSubscriptionInvoicePdf } from "../services/subscriptionInvoicePdf.service.js";

/**
 * School Admin's own self-serve billing endpoints — every existing SaaS-billing endpoint
 * (superAdminBilling.controllers.js) is Super-Admin-only, so a School had no way to see or
 * pay its own subscription. These are thin, school-scoped wrappers around the same
 * SchoolSubscription/SubscriptionInvoice models, always forcing schoolId from the
 * authenticated session — never from a request param, since (unlike the Super Admin routes,
 * which legitimately operate on any school) a School Admin must only ever reach their own.
 */

export const getMySubscription = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const subscription = await SchoolSubscription.findOne({ schoolId }).populate("planId");
  if (!subscription) throw new ApiError(404, "No subscription found for your school");

  if (subscription.endDate < new Date() && ["active", "trial"].includes(subscription.status)) {
    subscription.status = "expired";
    await subscription.save();
  }

  return res.status(200).json(new ApiResponse(200, subscription, "Subscription fetched"));
});

export const getMyInvoices = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const invoices = await SubscriptionInvoice.find({ schoolId }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, invoices, "Invoices fetched"));
});

export const downloadMyInvoicePdf = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);

  const invoice = await SubscriptionInvoice.findOne({ _id: req.params.invoiceId, schoolId }).lean();
  if (!invoice) throw new ApiError(404, "Invoice not found");

  const [school, subscription, config] = await Promise.all([
    School.findById(schoolId).select("name address email phone website").lean(),
    SchoolSubscription.findById(invoice.subscriptionId).populate("planId", "name").lean(),
    GlobalConfig.findOne({ key: "global" }).select("platformName supportEmail supportPhone currencySymbol").lean(),
  ]);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${String(invoice.invoiceNumber).replace(/\s+/g, "_")}.pdf`
  );

  renderSubscriptionInvoicePdf({
    stream: res,
    invoice,
    school,
    planName: subscription?.planId?.name || "Subscription plan",
    config: config || {},
  });
});

export const createMyPaymentIntent = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const invoice = await SubscriptionInvoice.findOne({ _id: req.params.invoiceId, schoolId }).populate("schoolId");
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status === "paid") throw new ApiError(400, "Invoice is already paid");

  const order = await createOrder({
    amount: invoice.totalAmount,
    receipt: invoice.invoiceNumber,
    notes: {
      invoiceId: invoice._id.toString(),
      schoolId: schoolId.toString(),
      schoolName: invoice.schoolId?.name || "",
    },
  });

  return res.status(200).json(new ApiResponse(200, {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    keyId: order.keyId,
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
  }, "Razorpay order created"));
});

export const verifyMyPayment = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req.user);
  const { invoiceId } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Ownership check before touching money — the invoice must actually belong to this school,
  // not just any invoice id the caller happens to pass.
  const invoice = await SubscriptionInvoice.findOne({ _id: invoiceId, schoolId });
  if (!invoice) throw new ApiError(404, "Invoice not found");

  const isValid = await verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!isValid) throw new ApiError(400, "Payment verification failed: invalid signature");

  const { payment } = await recordSubscriptionPayment({
    invoiceId,
    transactionId: razorpay_payment_id,
    gatewayOrderId: razorpay_order_id,
  });

  return res.status(200).json(new ApiResponse(200, { payment }, "Payment verified and recorded"));
});

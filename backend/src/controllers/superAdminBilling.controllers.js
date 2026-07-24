import PDFDocument from "pdfkit";
import Razorpay from "razorpay";
import { SubscriptionPlan } from "../models/SubscriptionPlan.model.js";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { SubscriptionInvoice } from "../models/SubscriptionInvoice.model.js";
import { SubscriptionPayment } from "../models/SubscriptionPayment.model.js";
import { SchoolUsage } from "../models/SchoolUsage.model.js";
import { PlanUpdateLog } from "../models/planUpdateLog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const buildSnapshotFromPlan = (plan) => ({
  price: plan.price,
  durationInDays: plan.durationInDays,
  features: plan.features || [],
  limits: plan.limits || {},
});

const buildEndDate = (startDate, days) => {
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);
  return end;
};

const calcTotalAmount = ({ planPrice = 0, discount = 0, taxGst = 0 }) =>
  Math.max(0, Number(planPrice) - Number(discount) + Number(taxGst));

const nextInvoiceNumber = async () => {
  const count = await SubscriptionInvoice.countDocuments();
  return `INV-${String(count + 1).padStart(6, "0")}`;
};

export const createPlanV2 = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    price,
    durationInDays,
    isTrialPlan,
    trialDurationInDays,
    features,
    limits,
    customForSchoolId,
    isActive,
  } = req.body;

  if (!name || price === undefined || !durationInDays) {
    throw new ApiError(400, "name, price and durationInDays are required");
  }

  const plan = await SubscriptionPlan.create({
    name,
    category,
    price,
    durationInDays,
    isTrialPlan,
    trialDurationInDays,
    features,
    limits,
    customForSchoolId,
    isActive,
  });

  return res.status(201).json(new ApiResponse(201, plan, "Plan created successfully"));
});

export const updatePlanV2 = asyncHandler(async (req, res) => {
  const oldPlan = await SubscriptionPlan.findById(req.params.planId);
  if (!oldPlan) throw new ApiError(404, "Plan not found");
  const oldData = oldPlan.toObject();

  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.planId, req.body, {
    new: true,
    runValidators: true,
  });

  await PlanUpdateLog.create({
    planId: plan._id,
    oldData,
    newData: plan.toObject(),
    updatedBy: req.user?._id,
  });

  const autoSyncSubs = await SchoolSubscription.find({
    planId: plan._id,
    autoSyncPlanUpdates: true,
  });

  for (const sub of autoSyncSubs) {
    sub.snapshot = buildSnapshotFromPlan(plan);
    await sub.save();
  }

  return res.status(200).json(new ApiResponse(200, plan, "Plan updated successfully"));
});

export const deactivatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(
    req.params.planId,
    { isActive: false },
    { new: true }
  );

  if (!plan) throw new ApiError(404, "Plan not found");
  return res.status(200).json(new ApiResponse(200, plan, "Plan deactivated successfully"));
});

export const assignPlanToSchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { planId, startDate, autoSyncPlanUpdates = true, isTrial = false } = req.body;

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) throw new ApiError(404, "Active plan not found");

  const start = startDate ? new Date(startDate) : new Date();
  const trialDays = plan.trialDurationInDays || plan.durationInDays;
  const end = buildEndDate(start, isTrial ? trialDays : plan.durationInDays);

  const updateDoc = {
    schoolId,
    planId,
    snapshot: buildSnapshotFromPlan(plan),
    startDate: start,
    endDate: end,
    autoSyncPlanUpdates,
    status: isTrial ? "trial" : "active",
    trialStartDate: isTrial ? start : null,
    trialEndDate: isTrial ? end : null,
  };

  const subscription = await SchoolSubscription.findOneAndUpdate({ schoolId }, updateDoc, {
    upsert: true,
    new: true,
    runValidators: true,
  });

  return res.status(200).json(new ApiResponse(200, subscription, "Plan assigned to school"));
});

export const changeSchoolPlan = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { planId, action } = req.body;

  if (!planId || !["upgrade", "downgrade"].includes(action)) {
    throw new ApiError(400, "planId and valid action (upgrade/downgrade) are required");
  }

  const subscription = await SchoolSubscription.findOne({ schoolId });
  if (!subscription) throw new ApiError(404, "Subscription not found for school");

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) throw new ApiError(404, "Target plan not found");

  subscription.planId = plan._id;
  subscription.snapshot = buildSnapshotFromPlan(plan);
  subscription.startDate = new Date();
  subscription.endDate = buildEndDate(new Date(), plan.durationInDays);
  subscription.status = "active";
  await subscription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, subscription, `School plan ${action}d successfully`));
});

export const renewSubscription = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const subscription = await SchoolSubscription.findOne({ schoolId }).populate("planId");

  if (!subscription) throw new ApiError(404, "Subscription not found");

  const fromDate = subscription.endDate > new Date() ? subscription.endDate : new Date();
  subscription.endDate = buildEndDate(fromDate, subscription.snapshot.durationInDays);
  subscription.status = "active";
  await subscription.save();

  return res.status(200).json(new ApiResponse(200, subscription, "Subscription renewed"));
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await SchoolSubscription.findOneAndUpdate(
    { schoolId: req.params.schoolId },
    { status: "cancelled", cancelledAt: new Date() },
    { new: true }
  );
  if (!subscription) throw new ApiError(404, "Subscription not found");
  return res.status(200).json(new ApiResponse(200, subscription, "Subscription cancelled"));
});

export const suspendSubscription = asyncHandler(async (req, res) => {
  const subscription = await SchoolSubscription.findOneAndUpdate(
    { schoolId: req.params.schoolId },
    { status: "suspended", suspendedAt: new Date() },
    { new: true }
  );
  if (!subscription) throw new ApiError(404, "Subscription not found");
  return res.status(200).json(new ApiResponse(200, subscription, "Subscription suspended"));
});

export const reactivateSubscription = asyncHandler(async (req, res) => {
  const subscription = await SchoolSubscription.findOneAndUpdate(
    { schoolId: req.params.schoolId },
    { status: "active", suspendedAt: null, cancelledAt: null },
    { new: true }
  );
  if (!subscription) throw new ApiError(404, "Subscription not found");
  return res.status(200).json(new ApiResponse(200, subscription, "Subscription reactivated"));
});

export const getSchoolSubscription = asyncHandler(async (req, res) => {
  const subscription = await SchoolSubscription.findOne({ schoolId: req.params.schoolId }).populate(
    "planId"
  );
  if (!subscription) throw new ApiError(404, "Subscription not found");

  if (subscription.endDate < new Date() && ["active", "trial"].includes(subscription.status)) {
    subscription.status = "expired";
    await subscription.save();
  }

  return res.status(200).json(new ApiResponse(200, subscription, "Subscription fetched"));
});

export const generateInvoice = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { discount = 0, taxGst = 0, dueDate, status = "unpaid" } = req.body;

  const subscription = await SchoolSubscription.findOne({ schoolId });
  if (!subscription) throw new ApiError(404, "Subscription not found");

  const invoiceNumber = await nextInvoiceNumber();
  const planPrice = subscription.snapshot.price;
  let normalizedDueDate = subscription.endDate;

  if (dueDate) {
    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      throw new ApiError(400, "Invalid dueDate. Please provide a valid date.");
    }
    normalizedDueDate = parsedDueDate;
  }

  const invoice = await SubscriptionInvoice.create({
    schoolId,
    subscriptionId: subscription._id,
    invoiceNumber,
    billingPeriodStart: subscription.startDate,
    billingPeriodEnd: subscription.endDate,
    planPrice,
    discount,
    taxGst,
    totalAmount: calcTotalAmount({ planPrice, discount, taxGst }),
    dueDate: normalizedDueDate,
    status,
  });

  return res.status(201).json(new ApiResponse(201, invoice, "Invoice generated"));
});

export const getSchoolInvoices = asyncHandler(async (req, res) => {
  const invoices = await SubscriptionInvoice.find({ schoolId: req.params.schoolId }).sort({
    createdAt: -1,
  });
  return res.status(200).json(new ApiResponse(200, invoices, "Invoices fetched"));
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await SubscriptionInvoice.findById(req.params.invoiceId).populate("schoolId", "name");
  if (!invoice) throw new ApiError(404, "Invoice not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoiceNumber.replace(/\s+/g, "_")}.pdf`
  );

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text("Subscription Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice No: ${invoice.invoiceNumber}`);
  doc.text(`School: ${invoice.schoolId?.name || "N/A"}`);
  doc.text(`Billing: ${invoice.billingPeriodStart.toDateString()} - ${invoice.billingPeriodEnd.toDateString()}`);
  doc.moveDown();
  doc.text(`Plan Price: ${invoice.planPrice}`);
  doc.text(`Discount: ${invoice.discount}`);
  doc.text(`Tax/GST: ${invoice.taxGst}`);
  doc.text(`Total: ${invoice.totalAmount}`);
  doc.text(`Status: ${invoice.status}`);
  doc.end();
});

export const addManualPayment = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { amount, paymentMode, transactionId, paymentProofUrl, status = "success" } = req.body;

  const invoice = await SubscriptionInvoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  const payment = await SubscriptionPayment.create({
    schoolId: invoice.schoolId,
    invoiceId,
    amount,
    paymentMode,
    transactionId,
    paymentProofUrl,
    status,
  });

  if (status === "success") {
    invoice.status = "paid";
    invoice.paidDate = new Date();
    await invoice.save();
  }

  return res.status(201).json(new ApiResponse(201, payment, "Payment added"));
});

export const createGatewayPaymentIntent = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, "Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }

  const invoice = await SubscriptionInvoice.findById(invoiceId).populate("schoolId");
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status === "paid") throw new ApiError(400, "Invoice is already paid");

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // Razorpay expects amount in paisa (1 INR = 100 paisa)
  const order = await razorpay.orders.create({
    amount: Math.round(invoice.totalAmount * 100),
    currency: "INR",
    receipt: invoice.invoiceNumber,
    notes: {
      invoiceId: invoice._id.toString(),
      schoolId: invoice.schoolId?._id?.toString() || invoice.schoolId?.toString(),
      schoolName: invoice.schoolId?.name || "",
    },
  });

  return res.status(200).json(new ApiResponse(200, {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    schoolName: invoice.schoolId?.name || "",
  }, "Razorpay order created"));
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, "Razorpay secret not configured");
  }

  // Verify signature
  const crypto = await import("crypto");
  const expectedSignature = crypto.default
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed: invalid signature");
  }

  const invoice = await SubscriptionInvoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  // Record the payment
  const payment = await SubscriptionPayment.create({
    schoolId: invoice.schoolId,
    invoiceId: invoice._id,
    amount: invoice.totalAmount,
    paymentMode: "gateway",
    transactionId: razorpay_payment_id,
    gatewayProvider: "razorpay",
    status: "success",
    paymentDate: new Date(),
  });

  // Mark invoice as paid
  invoice.status = "paid";
  invoice.paidDate = new Date();
  await invoice.save();

  return res.status(200).json(new ApiResponse(200, { payment, invoice }, "Payment verified and recorded"));
});

export const upsertSchoolUsage = asyncHandler(async (req, res) => {
  const usage = await SchoolUsage.findOneAndUpdate(
    { schoolId: req.params.schoolId },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, usage, "Usage updated"));
});

export const getSchoolUsage = asyncHandler(async (req, res) => {
  const usage = await SchoolUsage.findOne({ schoolId: req.params.schoolId });
  if (!usage) throw new ApiError(404, "Usage not found");
  return res.status(200).json(new ApiResponse(200, usage, "Usage fetched"));
});

export const getFeatureAccessControl = asyncHandler(async (req, res) => {
  const subscription = await SchoolSubscription.findOne({ schoolId: req.params.schoolId });
  if (!subscription) throw new ApiError(404, "Subscription not found");

  const moduleMap = {
    Attendance: false,
    Fees: false,
    Exam: false,
    "Online Exam": false,
    Transport: false,
    Hostel: false,
    Library: false,
    Payroll: false,
    Reports: false,
    "AI Features": false,
    "Mobile App": false,
  };

  for (const feature of subscription.snapshot.features || []) {
    moduleMap[feature.module] = Boolean(feature.allowed);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: subscription.status,
        modules: moduleMap,
        limits: subscription.snapshot.limits || {},
      },
      "Feature access fetched"
    )
  );
});


export const listAllInvoices = asyncHandler(async (req, res) => {
  const invoices = await SubscriptionInvoice.find()
    .populate("schoolId", "name")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, invoices, "All invoices fetched"));
});

export const listAllPayments = asyncHandler(async (req, res) => {
  const payments = await SubscriptionPayment.find()
    .populate("schoolId", "name")
    .populate("invoiceId", "invoiceNumber totalAmount status dueDate")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, payments, "All payments fetched"));
});

export const getRevenueSummary = asyncHandler(async (req, res) => {
  const invoices = await SubscriptionInvoice.find();
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const overdue = invoices
    .filter((inv) => ["overdue", "unpaid"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

  const byStatus = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalInvoiced,
        totalPaid,
        totalOutstanding: Math.max(0, totalInvoiced - totalPaid),
        overdue,
        countByStatus: byStatus,
      },
      "Revenue summary fetched"
    )
  );
});

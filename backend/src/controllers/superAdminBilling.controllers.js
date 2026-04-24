import PDFDocument from "pdfkit";
import { SubscriptionPlan } from "../models/SubscriptionPlan.model.js";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";
import { SubscriptionInvoice } from "../models/SubscriptionInvoice.model.js";
import { SubscriptionPayment } from "../models/SubscriptionPayment.model.js";
import { SchoolUsage } from "../models/SchoolUsage.model.js";
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
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.planId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!plan) throw new ApiError(404, "Plan not found");

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
    dueDate: dueDate ? new Date(dueDate) : subscription.endDate,
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
  const invoice = await SubscriptionInvoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  const mockIntent = {
    provider: req.body.gatewayProvider || "razorpay",
    invoiceId,
    amount: invoice.totalAmount,
    intentId: `intent_${Date.now()}`,
    status: "pending",
  };

  return res.status(200).json(new ApiResponse(200, mockIntent, "Gateway payment intent created"));
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

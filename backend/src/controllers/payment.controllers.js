import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

import { Payment } from "../models/payment.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { Refund } from "../models/Refund.model.js";
import { School } from "../models/school.model.js";
import { Student } from "../models/student.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { requireSchoolId } from "../utils/resolveSchoolId.js";
import { applyFeePayment } from "../services/feePayment.service.js";

const REFUND_MODES = ["cash", "online", "cheque", "bank_transfer", "upi", "adjustment"];

const getRazorpayInstance = async (schoolId) => {
  if (!mongoose.Types.ObjectId.isValid(schoolId)) throw new ApiError(400, "Invalid school ID");

  const school = await School.findById(schoolId).select("+razorpay.keyId +razorpay.keySecret razorpay.isEnabled");
  if (!school || !school.razorpay?.keyId || !school.razorpay?.keySecret) {
    throw new ApiError(400, "Razorpay not configured for this school. Please add Key ID and Key Secret in Settings.");
  }

  if (!school.razorpay.isEnabled) {
    throw new ApiError(400, "Razorpay is disabled for this school. Please enable it in Settings → School → Razorpay Integration.");
  }

  return {
    razorpay: new Razorpay({ key_id: school.razorpay.keyId, key_secret: school.razorpay.keySecret }),
    keySecret: school.razorpay.keySecret,
    keyId: school.razorpay.keyId,
  };
};

const ensureInstallmentAccess = async ({ installmentId, schoolId, user }) => {
  const installment = await FeeInstallment.findById(installmentId);
  if (!installment) throw new ApiError(404, "Installment not found");
  if (installment.schoolId.toString() !== schoolId.toString()) throw new ApiError(403, "Unauthorized access");

  // Student/Parent may only ever act on their own (or their linked child's) installment —
  // route middleware only checks role name, not record ownership, so it has to happen here.
  const roleName = user?.roleId?.name?.toLowerCase();
  if (roleName === "student") {
    const owns = await Student.exists({ _id: installment.studentId, userId: user._id, schoolId });
    if (!owns) throw new ApiError(403, "Access denied: this installment does not belong to you");
  } else if (roleName === "parent") {
    const owns = await Student.exists({
      _id: installment.studentId,
      schoolId,
      $or: [{ fatherId: user._id }, { motherId: user._id }, { guardianId: user._id }],
    });
    if (!owns) throw new ApiError(403, "This student is not linked with this parent");
  }

  return installment;
};


// Atomically creates the Payment record and updates both the installment AND its parent
// StudentFee (via applyFeePayment) so a crash — or just a code path that used to forget one of
// the two — can never leave the payment ledger, the installment, and the fee summary disagreeing
// with each other. This previously only updated the installment, leaving StudentFee.paidAmount/
// dueAmount/status stale after every self-service Razorpay payment.
//
// Idempotent on paymentData.transactionId (the gateway's payment id): the fee-payment webhook
// (webhook.controllers.js) and this same client-side verify path can both race to record the
// same real-world Razorpay payment. Checking first — rather than relying solely on the unique
// index to reject the loser — means whichever call comes second gets back the payment that was
// already recorded instead of an error.
export const recordPayment = async ({ installment, paymentData }) => {
  if (paymentData.transactionId) {
    const existing = await Payment.findOne({ transactionId: paymentData.transactionId });
    if (existing) {
      const studentFee = await StudentFee.findById(existing.studentFeeId);
      return { payment: existing, installment, studentFee, alreadyRecorded: true };
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [payment] = await Payment.create([paymentData], { session });
    const { studentFee, installment: updatedInstallment } = await applyFeePayment({
      installment,
      amount: paymentData.amountPaid,
      session,
    });

    payment.studentFeeId = studentFee._id;
    await payment.save({ session });

    await session.commitTransaction();
    return { payment, installment: updatedInstallment, studentFee };
  } catch (err) {
    await session.abortTransaction();
    // Lost the race between the pre-check above and this insert (webhook + client-verify firing
    // within milliseconds of each other) — the unique index on transactionId rejected us, so
    // whoever won already recorded this exact payment. Return their result instead of erroring.
    if (err?.code === 11000 && paymentData.transactionId) {
      const existing = await Payment.findOne({ transactionId: paymentData.transactionId });
      if (existing) {
        const studentFee = await StudentFee.findById(existing.studentFeeId);
        return { payment: existing, installment, studentFee, alreadyRecorded: true };
      }
    }
    throw err;
  } finally {
    session.endSession();
  }
};
export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, installmentId, amount, paymentMethod, paymentMode, transactionId, razorpay } = req.body;
  const schoolId = requireSchoolId(req.user);

  const installment = await ensureInstallmentAccess({ installmentId, schoolId, user: req.user });
  const mode = String(paymentMethod || paymentMode || "cash").toLowerCase();

  // The "cash"/"cheque"/"online" branch below records payment.amount straight from the request
  // body with no real-money verification (only the razorpay branch cryptographically verifies
  // anything actually happened). PAYMENT_CREATE_ROLES (payment.routes.js) includes Student/Parent
  // for self-service online payment, but with no mode restriction either of those roles could
  // submit a fabricated "cash" payment for their own installment and have it marked paid/partial
  // without paying anything at all.
  const selfServiceRoleName = req.user?.roleId?.name?.toLowerCase();
  if ((selfServiceRoleName === "student" || selfServiceRoleName === "parent") && mode !== "razorpay") {
    throw new ApiError(403, "Only online payment is available for self-service fee payment");
  }

  if (mode === "razorpay") {
    const dueAmount = installment.amount - installment.paidAmount;
    if (dueAmount <= 0) throw new ApiError(400, "Installment already paid");

    if (razorpay?.razorpay_order_id && razorpay?.razorpay_payment_id && razorpay?.razorpay_signature) {
      const { keySecret } = await getRazorpayInstance(schoolId);
      const body = `${razorpay.razorpay_order_id}|${razorpay.razorpay_payment_id}`;
      const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

      if (expectedSignature !== razorpay.razorpay_signature) {
        throw new ApiError(400, "Payment verification failed");
      }

      const { payment, studentFee } = await recordPayment({
        installment,
        paymentData: {
          schoolId,
          studentId: installment.studentId,
          installmentId,
          amountPaid: dueAmount,
          paymentMode: "razorpay",
          status: "success",
          razorpay,
          transactionId: razorpay.razorpay_payment_id,
          receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: "Payment verified and captured",
        data: { payment, studentFee },
      });
    }

    const { razorpay: razorpayClient, keyId } = await getRazorpayInstance(schoolId);
    const order = await razorpayClient.orders.create({
      amount: Math.round(dueAmount * 100),
      currency: "INR",
      receipt: `INST-${installmentId}`,
      notes: {
        schoolId: schoolId.toString(),
        installmentId,
        requestId: req.requestId,
      },
    });

    return sendSuccess(res, {
      message: "Razorpay order created",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      },
    });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Valid amount is required");
  }

  if (numericAmount > installment.amount - installment.paidAmount) {
    throw new ApiError(400, "Amount exceeds remaining due");
  }

  const { payment, studentFee } = await recordPayment({
    installment,
    paymentData: {
      schoolId,
      studentId: studentId || installment.studentId,
      installmentId,
      amountPaid: numericAmount,
      paymentMode: mode,
      status: "success",
      transactionId: transactionId || null,
      receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Payment created successfully",
    data: { payment, studentFee },
  });
});

// createRazorpayOrder/verifyRazorpayPayment (standalone order-create + verify) used to exist as
// separate endpoints here, duplicating exactly what createPayment's own "mode: razorpay" branch
// already does in one place (create an order when no gateway response is present yet, verify +
// capture when it is). Removed as dead code — confirmed zero frontend callers; RazorpayButton.jsx
// imports identically-named actions from superAdminBillingSlice.js, a different, unrelated
// platform-billing feature that hits its own backend endpoints, not these.

export const getPayments = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { id } = req.params;
  const { page = 1, limit = 20, paymentMode, startDate, endDate } = req.query;

  const filter = { schoolId };
  if (id) filter._id = id;

  // Payment.studentId refs the Student model, not User — req.user._id can never match it directly,
  // so Student/Parent callers need their actual Student._id(s) resolved first (see also
  // ensureInstallmentAccess above, which had the same User-vs-Student id mismatch).
  const roleName = req.userRole?.name;
  if (roleName === "Student") {
    const student = await Student.findOne({ userId: req.user._id, schoolId }).select("_id");
    filter.studentId = student?._id ?? null; // null → deliberately matches nothing rather than every payment
  } else if (roleName === "Parent") {
    const children = await Student.find({
      schoolId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id");
    filter.studentId = { $in: children.map((c) => c._id) };
  }
  if (paymentMode) filter.paymentMode = paymentMode;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .select("studentId installmentId amountPaid refundedAmount paymentMode status paymentDate receiptNo createdAt")
      .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name email" } })
      .populate("installmentId", "amount dueDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Payments fetched successfully",
    data: payments,
    meta: {
      page: Number(page),
      total,
    },
  });
});

/**
 * Refunds all or part of a successful payment. Reverses the linked FeeInstallment and/or
 * StudentFee ledgers so the student's outstanding balance is correct again, and records an
 * append-only Refund doc for the audit trail — the original Payment is never edited beyond its
 * own refundedAmount/status bookkeeping.
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { id: paymentId } = req.params;
  const { amount, reason, refundMode, transactionId } = req.body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Invalid refund amount");
  }
  if (!reason?.trim()) throw new ApiError(400, "A refund reason is required");

  const mode = String(refundMode || "cash").toLowerCase();
  if (!REFUND_MODES.includes(mode)) {
    throw new ApiError(400, `refundMode must be one of: ${REFUND_MODES.join(", ")}`);
  }

  const schoolId = requireSchoolId(req.user);

  const payment = await Payment.findOne({ _id: paymentId, schoolId });
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status !== "success") {
    throw new ApiError(400, `Only successful payments can be refunded (current status: ${payment.status})`);
  }

  const refundable = payment.amountPaid - (payment.refundedAmount || 0);
  if (numericAmount > refundable) {
    throw new ApiError(400, `Refund amount exceeds refundable balance (₹${refundable})`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Atomic guard re-checked inside the transaction — closes the race window between the read
    // above and here (e.g. two concurrent refund requests against the same payment).
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        schoolId,
        status: "success",
        $expr: { $lte: [{ $add: [{ $ifNull: ["$refundedAmount", 0] }, numericAmount] }, "$amountPaid"] },
      },
      [{
        $set: {
          refundedAmount: { $add: [{ $ifNull: ["$refundedAmount", 0] }, numericAmount] },
          status: {
            $cond: [
              { $gte: [{ $add: [{ $ifNull: ["$refundedAmount", 0] }, numericAmount] }, "$amountPaid"] },
              "refunded",
              "success",
            ],
          },
        },
      }],
      { new: true, session }
    );
    if (!updatedPayment) throw new ApiError(409, "Payment was modified concurrently — please retry");

    const [refund] = await Refund.create([{
      schoolId,
      paymentId,
      studentId: payment.studentId,
      studentFeeId: payment.studentFeeId,
      installmentId: payment.installmentId,
      amount: numericAmount,
      reason: reason.trim(),
      refundMode: mode,
      transactionId: transactionId || null,
      refundedBy: req.user._id,
    }], { session });

    // Reverse the installment ledger first (if this payment was installment-linked), then its
    // parent StudentFee — same $max-clamped floor as payInstallment's forward-direction $inc, so
    // a refund can never push either balance below zero even under odd historical data.
    if (payment.installmentId) {
      const installment = await FeeInstallment.findOneAndUpdate(
        { _id: payment.installmentId, schoolId },
        [{ $set: { paidAmount: { $max: [{ $subtract: ["$paidAmount", numericAmount] }, 0] } } }],
        { new: true, session }
      );
      if (installment) {
        installment.status =
          installment.paidAmount >= installment.amount ? "paid" :
          installment.paidAmount > 0 ? "partial" : "pending";
        await installment.save({ session });
      }
    }

    if (payment.studentFeeId) {
      const studentFee = await StudentFee.findOneAndUpdate(
        { _id: payment.studentFeeId, schoolId },
        [{ $set: { paidAmount: { $max: [{ $subtract: ["$paidAmount", numericAmount] }, 0] } } }],
        { new: true, session }
      );
      if (studentFee) {
        studentFee.dueAmount = Math.max(studentFee.totalAmount - studentFee.paidAmount, 0);
        studentFee.status =
          studentFee.paidAmount >= studentFee.totalAmount ? "paid" :
          studentFee.paidAmount > 0 ? "partial" : "pending";
        await studentFee.save({ session });
      }
    }

    await session.commitTransaction();

    return res.status(201).json(
      new ApiResponse(201, { refund, payment: updatedPayment }, "Refund processed successfully")
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

export const getRefunds = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { studentId, paymentId, page = 1, limit = 20 } = req.query;

  const filter = { schoolId };

  // Same User-vs-Student id mismatch guarded elsewhere in this file (getPayments) — Student/Parent
  // callers only ever see their own (or their linked child's) refund history.
  const roleName = req.userRole?.name;
  if (roleName === "Student") {
    const student = await Student.findOne({ userId: req.user._id, schoolId }).select("_id");
    filter.studentId = student?._id ?? null;
  } else if (roleName === "Parent") {
    const children = await Student.find({
      schoolId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id");
    filter.studentId = { $in: children.map((c) => c._id) };
  } else if (studentId) {
    filter.studentId = studentId;
  }
  if (paymentId) filter.paymentId = paymentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name email" } })
      .populate("refundedBy", "name")
      .populate("paymentId", "amountPaid receiptNo paymentMode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Refund.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Refunds fetched successfully",
    data: refunds,
    meta: { page: Number(page), total },
  });
});

export const paymentSummary = asyncHandler(async (req, res) => {
const schoolId = requireSchoolId(req.user);

  const [summary] = await Payment.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    {
      $group: {
        _id: null,
        // Nets out any refunded amount so a fully- or partially-refunded payment doesn't keep
        // counting its original amountPaid in full.
        totalAmount: { $sum: { $subtract: ["$amountPaid", { $ifNull: ["$refundedAmount", 0] }] } },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  return sendSuccess(res, {
    message: "Payment summary fetched",
    data: summary || { totalAmount: 0, totalTransactions: 0 },
  });
});

export const getRazorpayConfig = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);

  const school = await School.findById(schoolId).select("+razorpay.keyId razorpay.accountId razorpay.isEnabled");
  if (!school) throw new ApiError(404, "School not found");

  return sendSuccess(res, {
    message: "Razorpay config fetched",
    data: {
      keyId: school.razorpay?.keyId || "",
      accountId: school.razorpay?.accountId || "",
      isEnabled: Boolean(school.razorpay?.isEnabled),
      hasKeySecret: Boolean(school.razorpay?.keySecret),
    },
  });
});

export const updateRazorpayConfig = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);

  const { keyId, keySecret, accountId, isEnabled } = req.body;
  const school = await School.findById(schoolId).select("+razorpay.keyId +razorpay.keySecret razorpay.accountId razorpay.isEnabled");
  if (!school) throw new ApiError(404, "School not found");

  school.razorpay = school.razorpay || {};
  school.razorpay.keyId = keyId?.trim();
  school.razorpay.accountId = accountId?.trim() || "";
  school.razorpay.isEnabled = Boolean(isEnabled);

  if (keySecret?.trim()) {
    school.razorpay.keySecret = keySecret.trim();
  }

  if (school.razorpay.isEnabled && (!school.razorpay.keyId || !school.razorpay.keySecret)) {
    throw new ApiError(400, "Key ID and Key Secret are required to enable Razorpay");
  }

  await school.save();

  return sendSuccess(res, {
    message: "Razorpay config updated successfully",
    data: {
      keyId: school.razorpay?.keyId || "",
      accountId: school.razorpay?.accountId || "",
      isEnabled: Boolean(school.razorpay?.isEnabled),
      hasKeySecret: Boolean(school.razorpay?.keySecret),
    },
  });
});

import mongoose from "mongoose";

import { Payment } from "../models/payment.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { Refund } from "../models/Refund.model.js";
import { Student } from "../models/student.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { requireSchoolId } from "../utils/resolveSchoolId.js";
import { actingRoleName } from "../utils/actingRole.js";
import { applyInstallmentPayment, reverseAllocations } from "../services/feePayment.service.js";
import { outstandingOf, refreshInstallments, round2 } from "../services/feeSchedule.service.js";
import { confirmOnlinePayment, frontendBaseUrl, startOnlineCheckout } from "../services/onlinePayment.service.js";

const REFUND_MODES = ["cash", "online", "cheque", "bank_transfer", "upi", "card", "adjustment"];

// The roles the payment routes admit (PAYMENT_READ_ROLES and PAYMENT_CREATE_ROLES in
// routes/payment.routes.js, which are the same list), broadest first. Branching on the primary role
// alone let a Teacher holding "Parent" as an additional role pass the route and land in the staff
// branch: every payment in the school, and a counter "cash" payment marking any student's fee paid.
const PAYMENT_ROLES = ["Super Admin", "School Admin", "Accountant", "Student", "Parent"];
const paymentRole = (user) => {
  const role = actingRoleName(user, PAYMENT_ROLES);
  if (!role) throw new ApiError(403, "Forbidden. Insufficient role access.");
  return role;
};

/** Modes a staff member records at the counter — each just a record that money was received. */
const COUNTER_PAYMENT_MODES = ["cash", "upi", "card", "bank_transfer", "cheque", "online"];

/** Online checkout through the school's active gateway. "razorpay" is accepted from older clients. */
const GATEWAY_MODES = ["gateway", "razorpay"];

const newReceiptNo = () => `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * Student/Parent may only pay their own (or their linked child's) fees — route middleware checks
 * the role name, not record ownership. Staff may pay for any student of their own school.
 */
const assertCanPayForStudent = async ({ studentId, schoolId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid studentId");

  const roleName = paymentRole(user);
  const filter = { _id: studentId, schoolId };
  if (roleName === "Student") filter.userId = user._id;
  if (roleName === "Parent") {
    filter.$or = [{ fatherId: user._id }, { motherId: user._id }, { guardianId: user._id }];
  }

  if (!(await Student.exists(filter))) {
    throw new ApiError(
      403,
      roleName === "Parent" ? "This student is not linked with this parent" : "Access denied for this student"
    );
  }
};

/**
 * POST /payments — pays one or more of a student's installments.
 *
 * Body: { studentId, installmentIds: [], paymentMode, amount?, referenceNo?, remarks? }
 *
 *   - Counter modes (cash, UPI, card, bank transfer, cheque): records the payment now. `amount`
 *     may be less than what the selected installments owe (Partial Paid) but never more.
 *   - "gateway": starts an online checkout for everything the selected installments owe, on
 *     whichever gateway the school has active. Nothing is applied until the gateway confirms it
 *     (POST /payments/:id/verify, the return from the gateway, or its webhook).
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, installmentIds, amount, paymentMethod, paymentMode, referenceNo, remarks } = req.body;
  const schoolId = requireSchoolId(req.user);

  await assertCanPayForStudent({ studentId, schoolId, user: req.user });
  const mode = String(paymentMethod || paymentMode || "cash").toLowerCase();
  const isGateway = GATEWAY_MODES.includes(mode);

  // Every counter mode is just a claim that money changed hands. Student/Parent could otherwise
  // mark their own fee paid without paying anything.
  const roleName = paymentRole(req.user);
  if ((roleName === "Student" || roleName === "Parent") && !isGateway) {
    throw new ApiError(403, "Only online payment is available for self-service fee payment");
  }

  const ids = [...new Set((installmentIds || []).map(String))];
  if (!ids.length || ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new ApiError(400, "Select at least one valid installment to pay");
  }

  if (isGateway) {
    // Charge today's figure, fines included.
    await refreshInstallments({ schoolId, studentId });

    const installments = await FeeInstallment.find({ _id: { $in: ids }, schoolId, studentId });
    if (installments.length !== ids.length) {
      throw new ApiError(404, "Some selected installments were not found for this student");
    }

    const payable = round2(installments.reduce((sum, inst) => sum + outstandingOf(inst), 0));
    if (payable <= 0) throw new ApiError(400, "The selected installments are already paid");

    const checkout = await startOnlineCheckout({ req, schoolId, studentId, installments, payable, user: req.user });
    return sendSuccess(res, { message: "Checkout started", data: checkout });
  }

  if (!COUNTER_PAYMENT_MODES.includes(mode)) {
    throw new ApiError(400, `paymentMode must be one of: gateway, ${COUNTER_PAYMENT_MODES.join(", ")}`);
  }

  const numericAmount = round2(amount);
  if (!(numericAmount > 0)) throw new ApiError(400, "Valid amount is required");

  const session = await mongoose.startSession();
  let payment;
  let result;
  try {
    await session.withTransaction(async () => {
      result = await applyInstallmentPayment({
        schoolId,
        studentId,
        installmentIds: ids,
        amount: numericAmount,
        session,
      });

      const paidAt = new Date();
      [payment] = await Payment.create(
        [
          {
            schoolId,
            studentId,
            academicYearId: result.installments[0]?.academicYearId || null,
            allocations: result.allocations,
            amountPaid: numericAmount,
            paymentMode: mode,
            status: "success",
            referenceNo: referenceNo?.trim() || null,
            remarks: remarks?.trim() || null,
            paymentDate: paidAt,
            receiptNo: newReceiptNo(),
            collectedBy: req.user._id,
          },
        ],
        { session }
      );

      for (const fee of result.studentFees) {
        fee.lastPayment = {
          amount: round2(result.allocations.filter((a) => String(a.studentFeeId) === String(fee._id)).reduce((s, a) => s + a.amount, 0)),
          paymentMode: mode,
          referenceNo: referenceNo?.trim() || "",
          remarks: remarks?.trim() || "",
          paidAt,
          collectedBy: req.user._id,
        };
        await fee.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  const leftUnpaid = result.installments.some((inst) => inst.status !== "paid");
  return sendSuccess(res, {
    statusCode: 201,
    message: leftUnpaid ? "Partial payment recorded" : "Payment recorded successfully",
    data: { payment, partial: leftUnpaid, installments: result.installments, studentFees: result.studentFees },
  });
});

/**
 * POST /payments/:id/verify — the payer's browser reports that an online checkout finished (the
 * Razorpay popup closed with a result, or the payer landed back on the fee page).
 *
 * Nothing the browser sends is trusted: the server asks the checkout's own gateway what happened
 * and settles only what it reports as paid. Safe to call any number of times.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);

  const payment = await Payment.findOne({ _id: req.params.id, schoolId });
  if (!payment) throw new ApiError(404, "Payment not found");
  await assertCanPayForStudent({ studentId: payment.studentId, schoolId, user: req.user });

  if (!payment.gatewayOrderId && payment.status === "pending") {
    throw new ApiError(400, "This payment is not an online checkout");
  }

  const { state, payment: current } = await confirmOnlinePayment(payment);
  const messages = {
    paid: "Payment received",
    pending: "The payment is still being processed by the gateway. It will update automatically.",
    failed: "The payment did not go through. No money was taken for these installments.",
  };

  return sendSuccess(res, { message: messages[state], data: { state, payment: current } });
});

/**
 * GET|POST /payments/return/:paymentId — PUBLIC. Where a gateway sends the payer's browser back
 * after paying (PayU, Paytm and CCAvenue post a form here; Cashfree, PhonePe and Easebuzz
 * redirect). The browser carries no login token on that hop.
 *
 * Whatever the gateway posted is ignored for the decision: the server asks the gateway directly,
 * settles if paid, then sends the browser on to the fee page, which re-checks with the payer's own
 * login. A forged post here can at most make the server ask a gateway about a real checkout.
 */
export const returnFromGateway = async (req, res) => {
  const base = frontendBaseUrl();
  const { paymentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paymentId)) return res.redirect(303, `${base}/dashboard`);

  const payment = await Payment.findById(paymentId).catch(() => null);
  if (!payment) return res.redirect(303, `${base}/dashboard`);

  let state = "pending";
  try {
    ({ state } = await confirmOnlinePayment(payment));
  } catch (err) {
    console.error(`[payments] return confirm failed for ${paymentId}:`, err.message);
  }

  const target = new URL(`${base}${payment.checkoutReturnPath || "/dashboard"}`);
  target.searchParams.set("paymentId", String(payment._id));
  target.searchParams.set("payment", state);
  // 303 so a gateway's form POST becomes a plain GET of the fee page.
  return res.redirect(303, target.toString());
};

export const getPayments = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { id } = req.params;
  const { page = 1, limit = 20, paymentMode, startDate, endDate, studentId } = req.query;

  // Pending rows are online checkouts nobody finished; they are not payments.
  const filter = { schoolId, status: { $ne: "pending" } };
  if (id) filter._id = id;

  // Payment.studentId refs the Student model, not User — req.user._id can never match it directly,
  // so Student/Parent callers need their actual Student._id(s) resolved first.
  const roleName = paymentRole(req.user);
  if (roleName === "Student") {
    const student = await Student.findOne({ userId: req.user._id, schoolId }).select("_id");
    filter.studentId = student?._id ?? null; // null → deliberately matches nothing rather than every payment
  } else if (roleName === "Parent") {
    const children = await Student.find({
      schoolId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id");
    const childIds = children.map((c) => String(c._id));
    filter.studentId = studentId && childIds.includes(String(studentId)) ? studentId : { $in: childIds };
  } else if (studentId) {
    filter.studentId = studentId;
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
      .select("studentId allocations unallocatedAmount amountPaid refundedAmount paymentMode gateway status paymentDate receiptNo referenceNo remarks transactionId createdAt")
      .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name email" } })
      .populate({
        path: "allocations.installmentId",
        select: "installmentName dueDate studentFeeId",
        populate: {
          path: "studentFeeId",
          select: "feeStructureId",
          populate: { path: "feeStructureId", select: "feeHeadId", populate: { path: "feeHeadId", select: "name" } },
        },
      })
      .populate("collectedBy", "name")
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
 * Refunds all or part of a successful payment. Reverses the installment and StudentFee balances it
 * paid, so the student's outstanding balance is correct again, and records an append-only Refund
 * doc for the audit trail — the original Payment is never edited beyond its own
 * refundedAmount/status/allocation bookkeeping.
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

    if (payment.allocations?.length) {
      // Money that never reached an installment is refunded first — returning it touches no
      // balance. Only the rest is taken back out of the installments it paid.
      const alreadyRefunded = Number(payment.refundedAmount || 0);
      const allocatedRefunded = round2(payment.allocations.reduce((s, a) => s + Number(a.refundedAmount || 0), 0));
      const unallocatedLeft = Math.max(round2(Number(payment.unallocatedAmount || 0) - (alreadyRefunded - allocatedRefunded)), 0);
      const fromInstallments = round2(numericAmount - Math.min(numericAmount, unallocatedLeft));

      if (fromInstallments > 0) {
        const { allocations } = await reverseAllocations({
          schoolId,
          allocations: payment.allocations,
          amount: fromInstallments,
          session,
        });
        await Payment.updateOne({ _id: paymentId, schoolId }, { $set: { allocations } }, { session });
      }
    } else {
      // Older payments recorded against a single installment and/or fee head.
      if (payment.installmentId) {
        const installment = await FeeInstallment.findOneAndUpdate(
          { _id: payment.installmentId, schoolId },
          [{ $set: { paidAmount: { $max: [{ $subtract: ["$paidAmount", numericAmount] }, 0] } } }],
          { new: true, session }
        );
        if (installment) {
          installment.status =
            installment.paidAmount >= installment.amount + (installment.fineAmount || 0) ? "paid" :
            installment.paidAmount > 0 ? "partial" : "pending";
          await installment.save({ session });
        }
      }

      if (payment.studentFeeId) {
        const studentFee = await StudentFee.findOne({ _id: payment.studentFeeId, schoolId }).session(session);
        if (studentFee) {
          studentFee.paidAmount = Math.max(round2(studentFee.paidAmount - numericAmount), 0);
          // pre-save recomputes dueAmount/status
          await studentFee.save({ session });
        }
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
  const roleName = paymentRole(req.user);
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
    // Pending rows are unfinished online checkouts and failed ones moved no money.
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: { $in: ["success", "refunded"] } } },
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

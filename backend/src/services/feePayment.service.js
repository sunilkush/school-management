import { StudentFee } from "../models/studentFee.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getFeeSettings,
  outstandingOf,
  refreshInstallmentDocs,
  round2,
  statusOf,
  syncStudentFeeFines,
} from "./feeSchedule.service.js";

/**
 * Single place money is applied to a student's fee ledger. Every payment entry point — staff
 * counter, online checkout verify, Razorpay webhook — goes through applyInstallmentPayment, and
 * every refund through reverseAllocations, so FeeInstallment and StudentFee can never drift apart.
 *
 * Both must be called inside an active mongoose transaction session.
 */

/** Adds `delta` (negative to reverse) to each StudentFee's paidAmount and re-saves it. */
const applyToStudentFees = async ({ deltaByFeeId, session }) => {
  if (!deltaByFeeId.size) return [];
  const fees = await StudentFee.find({ _id: { $in: [...deltaByFeeId.keys()] } }).session(session);
  for (const fee of fees) {
    fee.paidAmount = Math.max(round2(Number(fee.paidAmount || 0) + deltaByFeeId.get(String(fee._id))), 0);
    // StudentFee's pre-save hook derives dueAmount/status from total + fine − paid.
    await fee.save({ session });
  }
  return fees;
};

/**
 * Spreads `amount` over the chosen installments of one student and applies it.
 *
 * Installments are brought up to date first (fine, overdue), so the payment is measured against
 * what is owed today. The oldest due installment is settled first. Partial payments are fine —
 * whatever does not cover an installment leaves it partial.
 *
 * Within an installment the money goes to the base amount before the fine, so if the school later
 * switches fines off, nothing already paid was for a fine that no longer exists.
 *
 * `allowExcess` is for money that has already arrived (an online payment): anything beyond what
 * the installments owe is returned as `excess` instead of refusing the payment. For the counter,
 * where the collector can simply take less, over-collection is an error.
 */
export const applyInstallmentPayment = async ({
  schoolId,
  studentId,
  installmentIds,
  amount,
  allowExcess = false,
  now = new Date(),
  session,
}) => {
  if (!session) throw new Error("applyInstallmentPayment must run inside a transaction");

  const ids = [...new Set((installmentIds || []).map(String))];
  if (!ids.length) throw new ApiError(400, "Select at least one installment to pay");

  const installments = await FeeInstallment.find({ _id: { $in: ids }, schoolId, studentId })
    .sort({ dueDate: 1, periodIndex: 1 })
    .session(session);
  if (installments.length !== ids.length) {
    throw new ApiError(404, "Some selected installments were not found for this student");
  }

  const { lateFine } = await getFeeSettings(schoolId, session);
  const refreshed = await refreshInstallmentDocs({ installments, lateFine, now, session });

  const payable = round2(installments.reduce((sum, inst) => sum + outstandingOf(inst), 0));
  const received = round2(amount);

  if (!(received > 0)) throw new ApiError(400, "Valid amount is required");
  if (!allowExcess) {
    if (payable <= 0) throw new ApiError(400, "The selected installments are already paid");
    if (received > payable) {
      throw new ApiError(400, `Amount ₹${received} is more than the ₹${payable} due on the selected installments`);
    }
  }

  let remaining = received;
  const allocations = [];
  const deltaByFeeId = new Map();

  for (const inst of installments) {
    if (remaining <= 0) break;
    const take = round2(Math.min(remaining, outstandingOf(inst)));
    if (take <= 0) continue;

    inst.paidAmount = round2(Number(inst.paidAmount || 0) + take);
    inst.status = statusOf(inst, now);
    await inst.save({ session });

    const feeId = String(inst.studentFeeId);
    deltaByFeeId.set(feeId, round2((deltaByFeeId.get(feeId) || 0) + take));
    allocations.push({ installmentId: inst._id, studentFeeId: inst.studentFeeId, amount: take, refundedAmount: 0 });
    remaining = round2(remaining - take);
  }

  // Fines may have moved during the refresh above; bring the StudentFee fine totals along before
  // the paid amounts are added, so each save computes due/status from current figures.
  await syncStudentFeeFines({ studentFeeIds: new Set([...refreshed, ...deltaByFeeId.keys()]), session });
  const studentFees = await applyToStudentFees({ deltaByFeeId, session });

  return { allocations, installments, studentFees, excess: remaining };
};

/**
 * Takes `amount` back out of a payment's allocations — the most recently due installment first,
 * never more from any one than was applied to it — and reverses the installment and StudentFee
 * balances to match. Returns the updated allocations to store on the Payment.
 */
export const reverseAllocations = async ({ schoolId, allocations, amount, now = new Date(), session }) => {
  if (!session) throw new Error("reverseAllocations must run inside a transaction");

  const updated = allocations.map((a) => ({
    installmentId: a.installmentId,
    studentFeeId: a.studentFeeId,
    amount: round2(a.amount),
    refundedAmount: round2(a.refundedAmount),
  }));

  const installments = await FeeInstallment.find({
    _id: { $in: updated.map((a) => a.installmentId) },
    schoolId,
  }).session(session);
  const instById = new Map(installments.map((i) => [String(i._id), i]));

  let remaining = round2(amount);
  const deltaByFeeId = new Map();

  for (let i = updated.length - 1; i >= 0 && remaining > 0; i -= 1) {
    const alloc = updated[i];
    const take = round2(Math.min(remaining, alloc.amount - alloc.refundedAmount));
    if (take <= 0) continue;

    alloc.refundedAmount = round2(alloc.refundedAmount + take);
    remaining = round2(remaining - take);

    const inst = instById.get(String(alloc.installmentId));
    if (inst) {
      inst.paidAmount = Math.max(round2(Number(inst.paidAmount || 0) - take), 0);
      inst.status = statusOf(inst, now);
      await inst.save({ session });
    }

    const feeId = String(alloc.studentFeeId);
    deltaByFeeId.set(feeId, round2((deltaByFeeId.get(feeId) || 0) - take));
  }

  if (remaining > 0) {
    throw new ApiError(400, `Refund is ₹${remaining} more than this payment applied to installments`);
  }

  const studentFees = await applyToStudentFees({ deltaByFeeId, session });
  return { allocations: updated, studentFees };
};

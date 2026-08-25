import { StudentFee } from "../models/studentFee.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Single place that applies a payment amount to a student's fee ledger. Every payment entry
 * point (staff-collected, self-service Razorpay, installment-specific) must go through this so
 * StudentFee.paidAmount/dueAmount/status can never drift from what FeeInstallment says — the
 * two used to be updated independently by different controllers, which silently went out of
 * sync the moment a payment came in through a path that only touched one of them.
 *
 * `installment`, when provided, must already be the fetched FeeInstallment document (not just
 * an id) — the callers that have ownership/tenant-checked it already hold the doc.
 * Must be called inside an active mongoose transaction session.
 */
export const applyFeePayment = async ({ studentFeeId, installment, amount, session }) => {
  const targetStudentFeeId = installment ? installment.studentFeeId : studentFeeId;
  if (!targetStudentFeeId) {
    throw new ApiError(400, "studentFeeId or installment is required to record a payment");
  }

  let updatedInstallment = null;
  if (installment) {
    updatedInstallment = await FeeInstallment.findByIdAndUpdate(
      installment._id,
      { $inc: { paidAmount: amount } },
      { new: true, session }
    );
    updatedInstallment.status =
      updatedInstallment.paidAmount >= updatedInstallment.amount ? "paid" : "partial";
    await updatedInstallment.save({ session });
  }

  const studentFee = await StudentFee.findByIdAndUpdate(
    targetStudentFeeId,
    { $inc: { paidAmount: amount } },
    { new: true, session }
  );
  if (!studentFee) throw new ApiError(404, "Student fee not found");

  studentFee.dueAmount = Math.max(studentFee.totalAmount - studentFee.paidAmount, 0);
  studentFee.status =
    studentFee.paidAmount >= studentFee.totalAmount
      ? "paid"
      : studentFee.paidAmount > 0
      ? "partial"
      : "pending";
  await studentFee.save({ session });

  return { studentFee, installment: updatedInstallment };
};
